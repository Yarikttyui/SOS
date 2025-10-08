package com.bashbosh.rescue.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bashbosh.rescue.R
import com.bashbosh.rescue.data.repository.AlertRepository
import com.bashbosh.rescue.data.repository.AuthRepository
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.domain.model.AlertStatus
import com.bashbosh.rescue.domain.model.UserSession
import com.bashbosh.rescue.notifications.AlertNotificationManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.stateIn

data class DashboardUiState(
    val isLoading: Boolean = false,
    val alerts: List<Alert> = emptyList(),
    val error: String? = null,
    val filterStatus: AlertStatus? = null
)

class DashboardViewModel(
    private val alertRepository: AlertRepository,
    private val authRepository: AuthRepository,
    private val notificationManager: AlertNotificationManager,
    private val applicationScope: CoroutineScope
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState(isLoading = true))
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    val session: StateFlow<UserSession> = authRepository.session
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserSession(tokens = null, user = null, isLoggedIn = false))

    init {
        refreshAlerts()
        observeAlertStream()
    }

    fun refreshAlerts(status: AlertStatus? = null) {
        _uiState.update { it.copy(isLoading = true, filterStatus = status, error = null) }
        viewModelScope.launch {
            alertRepository.fetchAlerts(status = status?.raw)
                .onSuccess { alerts ->
                    _uiState.update { it.copy(isLoading = false, alerts = alerts) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isLoading = false, error = error.localizedMessage ?: "Не удалось загрузить вызовы") }
                }
        }
    }

    private fun observeAlertStream() {
        viewModelScope.launch {
            alertRepository.observeAlertStream().collectLatest { alert ->
                _uiState.update { state ->
                    val existing = state.alerts.toMutableList()
                    val index = existing.indexOfFirst { it.id == alert.id }
                    if (index >= 0) {
                        existing[index] = alert
                    } else {
                        existing.add(0, alert)
                        applicationScope.launch {
                            notificationManager.notifyCriticalAlert(alert)
                        }
                    }
                    state.copy(alerts = existing)
                }
            }
        }
    }

    fun acceptAlert(alertId: String) {
        viewModelScope.launch {
            alertRepository.acceptAlert(alertId)
                .onSuccess { updated ->
                    _uiState.update { state ->
                        val items = state.alerts.toMutableList()
                        val index = items.indexOfFirst { it.id == updated.id }
                        if (index >= 0) items[index] = updated
                        state.copy(alerts = items)
                    }
                    applicationScope.launch {
                        notificationManager.cancelAlert(updated.id)
                        notificationManager.notifyStatusUpdate(updated, R.string.alert_status_message_accepted)
                    }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(error = error.localizedMessage ?: "Не удалось принять вызов") }
                }
        }
    }

    fun completeAlert(alertId: String, report: String?) {
        viewModelScope.launch {
            alertRepository.completeAlert(alertId, report)
                .onSuccess { updated ->
                    _uiState.update { state ->
                        val items = state.alerts.toMutableList()
                        val index = items.indexOfFirst { it.id == updated.id }
                        if (index >= 0) items[index] = updated
                        state.copy(alerts = items)
                    }
                    applicationScope.launch {
                        notificationManager.cancelAlert(updated.id)
                        notificationManager.notifyStatusUpdate(updated, R.string.alert_status_message_completed)
                    }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(error = error.localizedMessage ?: "Не удалось завершить вызов") }
                }
        }
    }
}
