package com.bashbosh.rescue.data.repository

import com.bashbosh.rescue.data.datasource.ApiService
import com.bashbosh.rescue.data.dto.LoginRequest
import com.bashbosh.rescue.data.dto.RefreshRequest
import com.bashbosh.rescue.data.dto.RegisterRequest
import com.bashbosh.rescue.data.mapper.toAuthTokens
import com.bashbosh.rescue.data.mapper.toDomain
import com.bashbosh.rescue.data.preferences.UserPreferencesDataSource
import com.bashbosh.rescue.domain.model.AuthTokens
import com.bashbosh.rescue.domain.model.RescueUser
import com.bashbosh.rescue.domain.model.UserSession
import kotlinx.coroutines.flow.Flow
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import retrofit2.HttpException
import java.io.IOException

class AuthRepository(
    private val apiService: ApiService,
    private val preferences: UserPreferencesDataSource
) {

    val session: Flow<UserSession> = preferences.session

    suspend fun login(email: String, password: String): Result<UserSession> = try {
        val response = apiService.login(LoginRequest(email = email, password = password))
        val tokens = response.toAuthTokens()
        preferences.updateTokens(tokens.accessToken, tokens.refreshToken, tokens.tokenType)

        val userDto = response.user ?: apiService.getCurrentUser()
        val user = userDto.toDomain()
        preferences.updateUser(user)

        Result.success(UserSession(tokens, user, isLoggedIn = true))
    } catch (t: Throwable) {
        Result.failure(t.toFriendlyAuthError())
    }

    suspend fun register(email: String, password: String, fullName: String?, phone: String?): Result<RescueUser> = try {
        val userDto = apiService.register(
            RegisterRequest(email = email, password = password, fullName = fullName, phone = phone)
        )
        val user = userDto.toDomain()
        preferences.updateUser(user)
        Result.success(user)
    } catch (t: Throwable) {
        Result.failure(t.toFriendlyAuthError())
    }

    suspend fun refreshToken(): Result<AuthTokens> = try {
        val refresh = preferences.getRefreshToken() ?: throw IllegalStateException("Missing refresh token")
        val response = apiService.refresh(RefreshRequest(refresh))
        val tokens = response.toAuthTokens()
        preferences.updateTokens(tokens.accessToken, tokens.refreshToken, tokens.tokenType)
        Result.success(tokens)
    } catch (t: Throwable) {
        Result.failure(t.toFriendlyAuthError())
    }

    suspend fun loadCurrentUser(force: Boolean = false): Result<RescueUser> = try {
        val current = apiService.getCurrentUser().toDomain()
        preferences.updateUser(current)
        Result.success(current)
    } catch (t: Throwable) {
        Result.failure(t.toFriendlyAuthError())
    }

    suspend fun logout() {
        preferences.clear()
    }
}

private fun Throwable.toFriendlyAuthError(): Throwable = when (this) {
    is HttpException -> {
        val body = try {
            response()?.errorBody()?.string()
        } catch (_: IOException) {
            null
        }
        val message = parseErrorDetail(body) ?: defaultMessageForCode(code())
        IllegalStateException(message, this)
    }
    is IOException -> IllegalStateException("Проверьте подключение к сети", this)
    else -> this
}

private fun HttpException.defaultMessageForCode(code: Int): String = when (code) {
    400 -> "Некорректные данные. Проверьте введённые поля"
    401 -> "Неверный логин или пароль"
    403 -> "Доступ запрещён"
    404 -> "Сервис недоступен. Попробуйте позже"
    500 -> "Ошибка сервера. Попробуйте ещё раз"
    else -> "Не удалось выполнить запрос ($code)"
}

private fun parseErrorDetail(body: String?): String? {
    if (body.isNullOrBlank()) return null
    return try {
        val json = JSONObject(body)
        when (val detail = json.opt("detail")) {
            is String -> detail.ifBlank { null }
            is JSONArray -> {
                (0 until detail.length())
                    .mapNotNull { index ->
                        when (val item = detail.opt(index)) {
                            is String -> item
                            is JSONObject -> item.optString("msg").ifBlank { null }
                            else -> null
                        }
                    }
                    .joinToString(separator = "\n")
                    .ifBlank { null }
            }
            is JSONObject -> detail.optString("msg").ifBlank { null }
            else -> null
        }
    } catch (_: JSONException) {
        null
    }
}
