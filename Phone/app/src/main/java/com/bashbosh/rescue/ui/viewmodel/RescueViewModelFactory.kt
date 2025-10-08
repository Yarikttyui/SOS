package com.bashbosh.rescue.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.bashbosh.rescue.app.RescueAppContainer

class RescueViewModelFactory(
    private val container: RescueAppContainer
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when {
        modelClass.isAssignableFrom(MainViewModel::class.java) -> MainViewModel(container) as T
    modelClass.isAssignableFrom(LoginViewModel::class.java) -> LoginViewModel() as T
        modelClass.isAssignableFrom(DashboardViewModel::class.java) -> DashboardViewModel(
            alertRepository = container.alertRepository,
            authRepository = container.authRepository,
            notificationManager = container.notificationManager,
            applicationScope = container.applicationScope
        ) as T
        modelClass.isAssignableFrom(AlertDetailViewModel::class.java) -> AlertDetailViewModel(
            alertRepository = container.alertRepository
        ) as T
        modelClass.isAssignableFrom(NotificationsViewModel::class.java) -> NotificationsViewModel(
            alertRepository = container.alertRepository
        ) as T
        else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
