package com.bashbosh.rescue.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.bashbosh.rescue.notifications.AlertNotificationManager

class RescueApplication : Application() {

    lateinit var container: RescueAppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(this)
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val alertChannel = NotificationChannel(
                AlertNotificationManager.ALERT_CHANNEL_ID,
                "Rescue Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical incident notifications with siren"
                enableLights(true)
                enableVibration(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            val silentChannel = NotificationChannel(
                AlertNotificationManager.SILENT_CHANNEL_ID,
                "Background sync",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Low-priority service notifications"
            }
            manager.createNotificationChannel(alertChannel)
            manager.createNotificationChannel(silentChannel)
        }
    }
}
