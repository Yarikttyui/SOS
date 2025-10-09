package com.bashbosh.rescue.data.network

import com.bashbosh.rescue.core.common.AppResult
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.domain.model.AlertPriority
import com.bashbosh.rescue.domain.model.AlertStatus
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.get
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import timber.log.Timber

class RescueApiClient(
    private val baseUrl: String,
    private val httpClient: HttpClient = defaultClient()
) {
    suspend fun fetchAlerts(): AppResult<List<Alert>> = withContext(Dispatchers.IO) {
        return@withContext try {
            val response: List<AlertResponse> = httpClient.get("$baseUrl/api/v1/alerts")
                .body()
            AppResult.Success(response.map { it.toDomain() })
        } catch (t: Throwable) {
            Timber.e(t, "Failed to fetch alerts")
            AppResult.Error(t)
        }
    }

    companion object {
        private fun defaultClient(): HttpClient = HttpClient(OkHttp) {
            install(ContentNegotiation) {
                json(
                    Json {
                        ignoreUnknownKeys = true
                        isLenient = true
                    }
                )
            }
            install(Logging) {
                logger = object : Logger {
                    override fun log(message: String) {
                        Timber.tag("RescueApi").d(message)
                    }
                }
                level = LogLevel.HEADERS
            }
        }
    }
}

@Serializable
private data class AlertResponse(
    val id: String,
    val title: String?,
    val description: String?,
    val priority: String,
    val status: String,
    @SerialName("created_at") val createdAt: String,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val address: String? = null
) {
    fun toDomain(): Alert = Alert(
        id = id,
        title = title.orEmpty(),
        description = description.orEmpty(),
        priority = runCatching { AlertPriority.valueOf(priority.uppercase()) }
            .getOrElse { AlertPriority.MEDIUM },
        status = runCatching { AlertStatus.valueOf(status.uppercase()) }
            .getOrElse { AlertStatus.NEW },
        createdAtIso = createdAt,
        latitude = latitude,
        longitude = longitude,
        address = address
    )
}
