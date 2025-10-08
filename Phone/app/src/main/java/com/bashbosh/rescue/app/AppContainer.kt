package com.bashbosh.rescue.app

import android.content.Context
import com.bashbosh.rescue.data.datasource.ApiService
import com.bashbosh.rescue.data.datasource.createApiService
import com.bashbosh.rescue.data.preferences.UserPreferencesDataSource
import com.bashbosh.rescue.data.repository.AlertRepository
import com.bashbosh.rescue.data.repository.AuthRepository
import com.bashbosh.rescue.notifications.AlertNotificationManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

interface RescueAppContainer {
    val apiService: ApiService
    val userPreferences: UserPreferencesDataSource
    val authRepository: AuthRepository
    val alertRepository: AlertRepository
    val notificationManager: AlertNotificationManager
    val applicationScope: CoroutineScope
}

class DefaultAppContainer(private val context: Context) : RescueAppContainer {

    override val applicationScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override val userPreferences: UserPreferencesDataSource by lazy {
        UserPreferencesDataSource(context)
    }

    override val apiService: ApiService by lazy {
        createApiService(
            userPreferences = userPreferences,
            onTokenRefreshed = { access, refresh ->
                applicationScope.launch {
                    userPreferences.updateTokens(access, refresh)
                }
            },
            onLogout = {
                applicationScope.launch {
                    userPreferences.clear()
                }
            }
        )
    }

    override val authRepository: AuthRepository by lazy {
        AuthRepository(apiService, userPreferences)
    }

    override val alertRepository: AlertRepository by lazy {
        AlertRepository(apiService, userPreferences)
    }

    override val notificationManager: AlertNotificationManager by lazy {
        AlertNotificationManager(context)
    }
}
