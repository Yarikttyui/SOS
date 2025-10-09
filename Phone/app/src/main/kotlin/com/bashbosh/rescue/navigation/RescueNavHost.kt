package com.bashbosh.rescue.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.bashbosh.rescue.ui.screens.dashboard.DashboardScreen
import com.bashbosh.rescue.ui.screens.splash.SplashScreen

enum class RescueDestinations(val route: String) {
    Splash("splash"),
    Dashboard("dashboard")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RescueNavHost(navController: NavHostController = rememberNavController()) {
    val snackbarState = remember { SnackbarHostState() }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarState) }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = RescueDestinations.Splash.route,
            modifier = Modifier.fillMaxSize()
        ) {
            composable(RescueDestinations.Splash.route) {
                SplashScreen(onFinished = {
                    navController.navigate(RescueDestinations.Dashboard.route) {
                        popUpTo(RescueDestinations.Splash.route) { inclusive = true }
                    }
                })
            }
            composable(RescueDestinations.Dashboard.route) {
                DashboardScreen(paddingValues = paddingValues)
            }
        }
    }
}
