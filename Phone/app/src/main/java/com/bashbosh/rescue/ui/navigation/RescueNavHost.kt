package com.bashbosh.rescue.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.bashbosh.rescue.ui.screens.AlertDetailScreen
import com.bashbosh.rescue.ui.screens.DashboardScreen
import com.bashbosh.rescue.ui.screens.LoginScreen
import com.bashbosh.rescue.ui.screens.NotificationsScreen
import com.bashbosh.rescue.ui.screens.SplashScreen
import com.bashbosh.rescue.ui.viewmodel.AlertDetailViewModel
import com.bashbosh.rescue.ui.viewmodel.DashboardViewModel
import com.bashbosh.rescue.ui.viewmodel.LoginViewModel
import com.bashbosh.rescue.ui.viewmodel.NotificationsViewModel
import com.bashbosh.rescue.ui.viewmodel.RescueViewModelFactory
import com.bashbosh.rescue.ui.viewmodel.SessionUiState

@Composable
fun RescueNavHost(
    sessionState: SessionUiState,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String, String?, String?) -> Unit,
    onLogout: () -> Unit,
    factory: RescueViewModelFactory,
    pendingAlertId: String?,
    onAlertConsumed: () -> Unit
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.Splash
    ) {
        addSplash(navController, sessionState, pendingAlertId, onAlertConsumed)
        addAuth(navController, sessionState, onLogin, onRegister, factory)
    addDashboard(navController, onLogout, factory)
        addAlertDetails(navController, factory)
        addNotifications(navController, factory)
    }

    LaunchedEffect(pendingAlertId, sessionState) {
        val alertId = pendingAlertId
        if (alertId.isNullOrBlank()) return@LaunchedEffect
        if (sessionState is SessionUiState.Ready && sessionState.session.isLoggedIn) {
            navController.navigate(Routes.alert(alertId))
            onAlertConsumed()
        }
    }
}

private fun NavGraphBuilder.addSplash(
    navController: NavHostController,
    sessionState: SessionUiState,
    pendingAlertId: String?,
    onAlertConsumed: () -> Unit
) {
    composable(Routes.Splash) {
        SplashScreen()
        LaunchedEffect(sessionState, pendingAlertId) {
            when (sessionState) {
                is SessionUiState.Loading -> Unit
                is SessionUiState.Ready -> {
                    val destination = if (sessionState.session.isLoggedIn) Routes.Dashboard else Routes.Auth
                    navController.navigate(destination) {
                        popUpTo(Routes.Splash) { inclusive = true }
                    }
                    val alertId = pendingAlertId
                    if (sessionState.session.isLoggedIn && !alertId.isNullOrBlank()) {
                        navController.navigate(Routes.alert(alertId))
                        onAlertConsumed()
                    }
                }
                is SessionUiState.Error -> {
                    navController.navigate(Routes.Auth) {
                        popUpTo(Routes.Splash) { inclusive = true }
                    }
                }
            }
        }
    }
}

private fun NavGraphBuilder.addAuth(
    navController: NavHostController,
    sessionState: SessionUiState,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String, String?, String?) -> Unit,
    factory: RescueViewModelFactory
) {
    composable(Routes.Auth) {
        val loginViewModel: LoginViewModel = viewModel(factory = factory)
        val validationError by loginViewModel.validationError.collectAsStateWithLifecycle()
        val email by loginViewModel.email.collectAsStateWithLifecycle()
        val password by loginViewModel.password.collectAsStateWithLifecycle()
        val fullName by loginViewModel.fullName.collectAsStateWithLifecycle()
        val phone by loginViewModel.phone.collectAsStateWithLifecycle()
        val isRegisterMode by loginViewModel.isRegisterMode.collectAsStateWithLifecycle()

        LoginScreen(
            email = email,
            password = password,
            fullName = fullName,
            phone = phone,
            isRegisterMode = isRegisterMode,
            validationError = validationError,
            serverError = (sessionState as? SessionUiState.Error)?.message,
            onEmailChange = loginViewModel::onEmailChange,
            onPasswordChange = loginViewModel::onPasswordChange,
            onFullNameChange = loginViewModel::onFullNameChange,
            onPhoneChange = loginViewModel::onPhoneChange,
            onToggleMode = loginViewModel::toggleMode,
            onSubmit = {
                if (loginViewModel.validate()) {
                    if (isRegisterMode) {
                        onRegister(email, password, fullName.takeIf { it.isNotBlank() }, phone.takeIf { it.isNotBlank() })
                    } else {
                        onLogin(email, password)
                    }
                }
            }
        )
    }
}

private fun NavGraphBuilder.addDashboard(
    navController: NavHostController,
    onLogout: () -> Unit,
    factory: RescueViewModelFactory
) {
    composable(Routes.Dashboard) {
        val viewModel: DashboardViewModel = viewModel(factory = factory)
        val state by viewModel.uiState.collectAsStateWithLifecycle()
        val session by viewModel.session.collectAsStateWithLifecycle()

        DashboardScreen(
            state = state,
            session = session,
            onSelectAlert = { alertId -> navController.navigate(Routes.alert(alertId)) },
            onRefresh = { status -> viewModel.refreshAlerts(status) },
            onLogout = onLogout,
            onAcceptAlert = viewModel::acceptAlert,
            onCompleteAlert = viewModel::completeAlert,
            onOpenNotifications = { navController.navigate(Routes.Notifications) }
        )
    }
}

private fun NavGraphBuilder.addAlertDetails(
    navController: NavHostController,
    factory: RescueViewModelFactory
) {
    composable(Routes.AlertDetails) { backStackEntry ->
        val alertId = backStackEntry.arguments?.getString("alertId") ?: return@composable
        val viewModel: AlertDetailViewModel = viewModel(factory = factory)
        val state by viewModel.state.collectAsStateWithLifecycle()

        LaunchedEffect(alertId) {
            viewModel.loadAlert(alertId)
        }

        AlertDetailScreen(
            state = state,
            onBack = { navController.popBackStack() },
            onAccept = { viewModel.accept(alertId) },
            onComplete = { report -> viewModel.complete(alertId, report) }
        )
    }
}

private fun NavGraphBuilder.addNotifications(
    navController: NavHostController,
    factory: RescueViewModelFactory
) {
    composable(Routes.Notifications) {
        val viewModel: NotificationsViewModel = viewModel(factory = factory)
        val state by viewModel.state.collectAsStateWithLifecycle()

        NotificationsScreen(
            state = state,
            onBack = { navController.popBackStack() },
            onRefresh = viewModel::refresh,
            onMarkAllRead = viewModel::markAllRead,
            onMarkRead = viewModel::markAsRead
        )
    }
}
