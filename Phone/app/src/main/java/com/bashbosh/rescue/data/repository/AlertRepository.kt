package com.bashbosh.rescue.data.repository

import com.bashbosh.rescue.data.datasource.AlertWebSocketDataSource
import com.bashbosh.rescue.data.datasource.ApiService
import com.bashbosh.rescue.data.dto.AlertUpdateRequest
import com.bashbosh.rescue.data.dto.NotificationUpdateRequest
import com.bashbosh.rescue.data.mapper.toDomain
import com.bashbosh.rescue.data.preferences.UserPreferencesDataSource
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.domain.model.AlertNotification
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map

class AlertRepository(
    private val apiService: ApiService,
    private val preferences: UserPreferencesDataSource,
    private val webSocketDataSource: AlertWebSocketDataSource = AlertWebSocketDataSource()
) {

    suspend fun fetchAlerts(status: String? = null, type: String? = null): Result<List<Alert>> = runCatching {
        apiService.getAlerts(status = status, type = type).map { it.toDomain() }
    }

    suspend fun getAlert(alertId: String): Result<Alert> = runCatching {
        apiService.getAlert(alertId).toDomain()
    }

    suspend fun acceptAlert(alertId: String): Result<Alert> = runCatching {
        apiService.updateAlert(alertId, AlertUpdateRequest(status = "in_progress")).toDomain()
    }

    suspend fun completeAlert(alertId: String, report: String? = null): Result<Alert> = runCatching {
        apiService.updateAlert(alertId, AlertUpdateRequest(status = "completed", description = report)).toDomain()
    }

    fun observeAlertStream(): Flow<Alert> = flow {
        val session = preferences.session
        val snapshot = session.first()
        val tokens = snapshot.tokens ?: return@flow
        val user = snapshot.user ?: return@flow
        emitAll(
            webSocketDataSource.observeAlerts(userId = user.id, token = tokens.accessToken)
                .map { it.toDomain() }
        )
    }

    suspend fun fetchNotifications(unreadOnly: Boolean = false): Result<List<AlertNotification>> = runCatching {
        apiService.getNotifications(unreadOnly = unreadOnly).map { it.toDomain() }
    }

    suspend fun markNotificationRead(id: String): Result<AlertNotification> = runCatching {
        apiService.markNotification(id, NotificationUpdateRequest(isRead = true)).toDomain()
    }

    suspend fun markAllNotificationsRead(): Result<Unit> = runCatching {
        apiService.markAllRead()
        Unit
    }
}
