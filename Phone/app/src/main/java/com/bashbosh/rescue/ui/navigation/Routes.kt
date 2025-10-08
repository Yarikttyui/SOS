package com.bashbosh.rescue.ui.navigation

object Routes {
    const val Splash = "splash"
    const val Auth = "auth"
    const val Dashboard = "dashboard"
    const val AlertDetails = "alert/{alertId}"
    const val Notifications = "notifications"

    fun alert(alertId: String) = "alert/$alertId"
}
