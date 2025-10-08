package com.bashbosh.rescue.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bashbosh.rescue.data.repository.AlertRepository
import com.bashbosh.rescue.domain.model.AlertNotification
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationsUiState(
    val isLoading: Boolean = true,
    val notifications: List<AlertNotification> = emptyList(),
    val error: String? = null
)

class NotificationsViewModel(
    private val alertRepository: AlertRepository
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            alertRepository.fetchNotifications()
                .onSuccess { list ->
                    _state.value = NotificationsUiState(isLoading = false, notifications = list)
                }
                .onFailure { error ->
                    _state.value = NotificationsUiState(
                        isLoading = false,
                        notifications = emptyList(),
                        error = error.localizedMessage ?: "Не удалось загрузить уведомления"
                    )
                }
        }
    }

    fun markAsRead(id: String) {
        viewModelScope.launch {
            alertRepository.markNotificationRead(id)
            refresh()
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            alertRepository.markAllNotificationsRead()
            refresh()
        }
    }
}
