package com.bashbosh.rescue.ui.screens.dashboard.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bashbosh.rescue.core.common.AppResult
import com.bashbosh.rescue.domain.usecase.ObserveActiveAlertsUseCase
import com.bashbosh.rescue.ui.screens.dashboard.model.AlertUiModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val observeActiveAlerts: ObserveActiveAlertsUseCase
) : ViewModel() {

    private val _alerts = MutableStateFlow<List<AlertUiModel>>(emptyList())
    val alerts: StateFlow<List<AlertUiModel>> = _alerts.asStateFlow()

    init {
        viewModelScope.launch {
            observeActiveAlerts().collect { result ->
                if (result is AppResult.Success) {
                    _alerts.value = result.value.map { alert ->
                        AlertUiModel(
                            id = alert.id,
                            title = alert.title.ifBlank { "SOS сигнал" },
                            description = alert.description.ifBlank { "Описание отсутствует" },
                            priority = alert.priority.name,
                            status = alert.status.name
                        )
                    }
                }
            }
        }
    }
}
