package com.bashbosh.rescue.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bashbosh.rescue.app.RescueApplication
import com.bashbosh.rescue.ui.navigation.RescueNavHost
import com.bashbosh.rescue.ui.theme.RescueTheme
import com.bashbosh.rescue.ui.viewmodel.MainViewModel
import com.bashbosh.rescue.ui.viewmodel.RescueViewModelFactory

class MainActivity : ComponentActivity() {

    private val container by lazy { (application as RescueApplication).container }
    private val pendingAlertId = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        pendingAlertId.value = extractAlertId(intent)
        setContent {
            val factory = RescueViewModelFactory(container)
            RescueApp(
                factory = factory,
                pendingAlertId = pendingAlertId.value,
                onAlertConsumed = ::clearPendingAlert
            )
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        if (intent != null) {
            setIntent(intent)
        }
        pendingAlertId.value = extractAlertId(intent)
    }

    private fun clearPendingAlert() {
        pendingAlertId.value = null
        intent?.removeExtra(EXTRA_ALERT_ID)
    }

    companion object {
        private const val EXTRA_ALERT_ID = "extra_alert_id"

        fun createAlertIntent(context: Context, alertId: String): Intent = Intent(context, MainActivity::class.java).apply {
            putExtra(EXTRA_ALERT_ID, alertId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        fun extractAlertId(intent: Intent?): String? = intent?.getStringExtra(EXTRA_ALERT_ID)
    }
}

@Composable
fun RescueApp(
    factory: RescueViewModelFactory,
    pendingAlertId: String?,
    onAlertConsumed: () -> Unit
) {
    val mainViewModel: MainViewModel = viewModel(factory = factory)
    val state by mainViewModel.sessionState.collectAsState()

    RescueTheme {
        RescueNavHost(
            sessionState = state,
            onLogin = { email, password -> mainViewModel.login(email, password) },
            onRegister = { email, password, fullName, phone ->
                mainViewModel.register(email, password, fullName, phone)
            },
            onLogout = { mainViewModel.logout() },
            factory = factory,
            pendingAlertId = pendingAlertId,
            onAlertConsumed = onAlertConsumed
        )
    }
}
