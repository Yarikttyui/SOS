package com.bashbosh.rescue.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bashbosh.rescue.data.repository.AlertRepository
import com.bashbosh.rescue.domain.model.Alert
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed class AlertDetailState {
    object Loading : AlertDetailState()
    data class Loaded(val alert: Alert) : AlertDetailState()
    data class Error(val message: String) : AlertDetailState()
}

class AlertDetailViewModel(
    private val alertRepository: AlertRepository
) : ViewModel() {

    private val _state = MutableStateFlow<AlertDetailState>(AlertDetailState.Loading)
    val state: StateFlow<AlertDetailState> = _state

    fun loadAlert(alertId: String) {
        _state.value = AlertDetailState.Loading
        viewModelScope.launch {
            alertRepository.getAlert(alertId)
                .onSuccess { alert -> _state.value = AlertDetailState.Loaded(alert) }
                .onFailure { error ->
                    _state.value = AlertDetailState.Error(error.localizedMessage ?: "Не удалось загрузить детали")
                }
        }
    }

    fun accept(alertId: String) {
        viewModelScope.launch {
            alertRepository.acceptAlert(alertId)
                .onSuccess { alert -> _state.value = AlertDetailState.Loaded(alert) }
                .onFailure { error ->
                    _state.value = AlertDetailState.Error(error.localizedMessage ?: "Не удалось принять вызов")
                }
        }
    }

    fun complete(alertId: String, report: String?) {
        viewModelScope.launch {
            alertRepository.completeAlert(alertId, report)
                .onSuccess { alert -> _state.value = AlertDetailState.Loaded(alert) }
                .onFailure { error ->
                    _state.value = AlertDetailState.Error(error.localizedMessage ?: "Не удалось завершить вызов")
                }
        }
    }
}
