package com.bashbosh.rescue.data.datasource

import com.bashbosh.rescue.BuildConfig
import com.bashbosh.rescue.data.dto.AlertDto
import com.bashbosh.rescue.data.dto.AlertUpdateRequest
import com.bashbosh.rescue.data.dto.LoginRequest
import com.bashbosh.rescue.data.dto.NotificationDto
import com.bashbosh.rescue.data.dto.NotificationUpdateRequest
import com.bashbosh.rescue.data.dto.RefreshRequest
import com.bashbosh.rescue.data.dto.RegisterRequest
import com.bashbosh.rescue.data.dto.TokenResponseDto
import com.bashbosh.rescue.data.dto.UserDto
import com.bashbosh.rescue.data.preferences.UserPreferencesDataSource
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import java.io.IOException
import java.util.concurrent.TimeUnit

interface ApiService {

    // Authentication
    @POST("/api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): TokenResponseDto

    @POST("/api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): UserDto

    @POST("/api/v1/auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): TokenResponseDto

    @GET("/api/v1/auth/me")
    suspend fun getCurrentUser(): UserDto

    // Alerts
    @GET("/api/v1/sos/")
    suspend fun getAlerts(
        @Query("status") status: String? = null,
        @Query("type") type: String? = null,
        @Query("skip") skip: Int = 0,
        @Query("limit") limit: Int = 50
    ): List<AlertDto>

    @GET("/api/v1/sos/{id}")
    suspend fun getAlert(@Path("id") alertId: String): AlertDto

    @PATCH("/api/v1/sos/{id}")
    suspend fun updateAlert(
        @Path("id") alertId: String,
        @Body request: AlertUpdateRequest
    ): AlertDto

    // Notifications
    @GET("/api/v1/notifications/")
    suspend fun getNotifications(
        @Query("unread_only") unreadOnly: Boolean = false,
        @Query("skip") skip: Int = 0,
        @Query("limit") limit: Int = 50
    ): List<NotificationDto>

    @PATCH("/api/v1/notifications/{id}")
    suspend fun markNotification(@Path("id") id: String, @Body request: NotificationUpdateRequest): NotificationDto

    @POST("/api/v1/notifications/mark-all-read")
    suspend fun markAllRead(): Map<String, String>
}

private fun provideOkHttpClient(
    userPreferences: UserPreferencesDataSource,
    onTokenRefreshed: suspend (String, String) -> Unit,
    onLogout: suspend () -> Unit
): OkHttpClient {
    val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
    }

    val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val builder = original.newBuilder()

        val token = runCatching {
            runBlockingMaybe { userPreferences.getAccessToken() }
        }.getOrNull()

        if (!token.isNullOrBlank()) {
            builder.addHeader("Authorization", "Bearer $token")
        }

        val request = builder.build()
        chain.proceed(request)
    }

    val authenticator = TokenRefreshAuthenticator(
        userPreferences = userPreferences,
        onTokenRefreshed = onTokenRefreshed,
        onLogout = onLogout
    )

    return OkHttpClient.Builder()
        .addInterceptor(logging)
        .addInterceptor(authInterceptor)
        .authenticator(authenticator)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
}

@Suppress("TooGenericExceptionCaught")
private fun runBlockingMaybe(block: suspend () -> String?): String? = try {
    kotlinx.coroutines.runBlocking { block() }
} catch (e: Exception) {
    null
}

private fun provideRetrofit(client: OkHttpClient, gson: Gson, baseUrl: String): Retrofit = Retrofit.Builder()
    .client(client)
    .baseUrl(baseUrl.ensureTrailingSlash())
    .addConverterFactory(GsonConverterFactory.create(gson))
    .build()

private fun String.ensureTrailingSlash(): String = if (endsWith('/')) this else "$this/"

fun createApiService(
    userPreferences: UserPreferencesDataSource,
    onTokenRefreshed: suspend (String, String) -> Unit,
    onLogout: suspend () -> Unit
): ApiService {
    val gson = GsonBuilder()
        .setLenient()
        .create()

    val okHttpClient = provideOkHttpClient(userPreferences, onTokenRefreshed, onLogout)

    val primaryBaseUrl = BuildConfig.API_BASE_URL.ifBlank { "http://10.0.2.2:8000" }
    val fallbackBaseUrl = BuildConfig.API_FALLBACK_URL.ifBlank { primaryBaseUrl }

    val retrofit = provideRetrofit(okHttpClient, gson, primaryBaseUrl)
    val service = retrofit.create(ApiService::class.java)

    return FallbackApiService(service, fallbackBaseUrl, gson, okHttpClient)
}

private class FallbackApiService(
    private val primary: ApiService,
    private val fallbackBaseUrl: String,
    private val gson: Gson,
    private val client: OkHttpClient
) : ApiService by primary {

    override suspend fun login(request: LoginRequest): TokenResponseDto = withFallback {
        primary.login(request)
    }

    override suspend fun register(request: RegisterRequest): UserDto = withFallback {
        primary.register(request)
    }

    override suspend fun refresh(request: RefreshRequest): TokenResponseDto = withFallback {
        primary.refresh(request)
    }

    override suspend fun getCurrentUser(): UserDto = withFallback {
        primary.getCurrentUser()
    }

    override suspend fun getAlerts(status: String?, type: String?, skip: Int, limit: Int): List<AlertDto> = withFallback {
        primary.getAlerts(status, type, skip, limit)
    }

    override suspend fun getAlert(alertId: String): AlertDto = withFallback {
        primary.getAlert(alertId)
    }

    override suspend fun updateAlert(alertId: String, request: AlertUpdateRequest): AlertDto = withFallback {
        primary.updateAlert(alertId, request)
    }

    override suspend fun getNotifications(unreadOnly: Boolean, skip: Int, limit: Int): List<NotificationDto> = withFallback {
        primary.getNotifications(unreadOnly, skip, limit)
    }

    override suspend fun markNotification(id: String, request: NotificationUpdateRequest): NotificationDto = withFallback {
        primary.markNotification(id, request)
    }

    override suspend fun markAllRead(): Map<String, String> = withFallback {
        primary.markAllRead()
    }

    private suspend fun <T> withFallback(block: suspend () -> T): T {
        return try {
            block()
        } catch (io: IOException) {
            if (fallbackBaseUrl.isBlank()) throw io
            val fallbackRetrofit = provideRetrofit(client, gson, fallbackBaseUrl)
            val fallbackService = fallbackRetrofit.create(ApiService::class.java)
            fallbackService.block()
        }
    }
}

private class TokenRefreshAuthenticator(
    private val userPreferences: UserPreferencesDataSource,
    private val onTokenRefreshed: suspend (String, String) -> Unit,
    private val onLogout: suspend () -> Unit
) : okhttp3.Authenticator {

    override fun authenticate(route: okhttp3.Route?, response: Response): Request? {
        if (responseCount(response) >= 2) {
            runBlockingMaybe { onLogout() }
            return null
        }

        val refreshToken = runBlockingMaybe { userPreferences.getRefreshToken() }
        if (refreshToken.isNullOrBlank()) {
            runBlockingMaybe { onLogout() }
            return null
        }

        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL.ifBlank { "http://10.0.2.2:8000/" })
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val service = retrofit.create(ApiService::class.java)

        return try {
            val result = kotlinx.coroutines.runBlocking {
                service.refresh(RefreshRequest(refreshToken))
            }
            runBlockingMaybe { onTokenRefreshed(result.accessToken, result.refreshToken) }
            response.request.newBuilder()
                .header("Authorization", "Bearer ${result.accessToken}")
                .build()
        } catch (ex: Exception) {
            runBlockingMaybe { onLogout() }
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var priorResponse = response.priorResponse
        while (priorResponse != null) {
            result++
            priorResponse = priorResponse.priorResponse
        }
        return result
    }
}
