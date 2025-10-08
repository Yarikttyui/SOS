package com.bashbosh.rescue.notifications

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.bashbosh.rescue.R
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class AlertNotificationManager(private val context: Context) {

    private val notificationManager = NotificationManagerCompat.from(context)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun notifyCriticalAlert(alert: Alert, repeats: Int = 3) {
        scope.launch {
            repeat(repeats.coerceAtLeast(1)) { index ->
                val notificationId = buildNotificationId(alert.id, index)
                val openIntent = PendingIntent.getActivity(
                    context,
                    notificationId,
                    MainActivity.createAlertIntent(context, alert.id),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )

                val stopIntent = PendingIntent.getBroadcast(
                    context,
                    notificationId + 1000,
                    AlertActionsReceiver.createStopSirenIntent(context, alert.id),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )

                val contentText = alert.address ?: alert.description ?: context.getString(R.string.alert_notification_description_fallback)

                val notification = NotificationCompat.Builder(context, ALERT_CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_alert_buoy)
                    .setContentTitle(context.getString(R.string.alert_notification_title, alert.title ?: alert.type.raw.uppercase()))
                    .setContentText(contentText)
                    .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setAutoCancel(true)
                    .setOngoing(true)
                    .setContentIntent(openIntent)
                    .setFullScreenIntent(openIntent, true)
                    .addAction(
                        R.drawable.ic_stop,
                        context.getString(R.string.alert_notification_stop_action),
                        stopIntent
                    )
                    .build()

                notificationManager.notify(notificationId, notification)

                if (index == 0) {
                    SirenService.start(context, alert.id)
                }

                if (index < repeats - 1) {
                    delay(15000)
                }
            }
        }
    }

    fun notifyStatusUpdate(alert: Alert, messageRes: Int) {
        val message = context.getString(messageRes)
        val notificationId = buildNotificationId(alert.id, 0)
        val openIntent = PendingIntent.getActivity(
            context,
            notificationId,
            MainActivity.createAlertIntent(context, alert.id),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, ALERT_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_alert_buoy)
            .setContentTitle(context.getString(R.string.alert_status_update_title, alert.title ?: alert.type.raw.uppercase()))
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(openIntent)
            .build()

        notificationManager.notify(notificationId + STATUS_OFFSET, notification)
    }

    fun cancelAlert(alertId: String) {
        repeat(5) { index ->
            notificationManager.cancel(buildNotificationId(alertId, index))
        }
        notificationManager.cancel(buildNotificationId(alertId, 0) + STATUS_OFFSET)
        SirenService.stop(context)
    }

    companion object {
        const val ALERT_CHANNEL_ID = "rescue_alert_channel"
        const val SILENT_CHANNEL_ID = "rescue_silent_channel"
        private const val STATUS_OFFSET = 10_000

        fun ensureChannels(context: Context) {
            ContextCompat.getSystemService(context, NotificationManagerCompat::class.java)
        }
    }
}
