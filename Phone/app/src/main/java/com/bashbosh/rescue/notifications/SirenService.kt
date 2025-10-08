package com.bashbosh.rescue.notifications

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.bashbosh.rescue.R
import androidx.core.content.ContextCompat

class SirenService : Service() {

    private var mediaPlayer: MediaPlayer? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val alertId = intent?.getStringExtra(EXTRA_ALERT_ID)
        startForeground(NOTIFICATION_ID, buildForegroundNotification(alertId))
        startSiren()
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        stopSiren()
    }

    private fun startSiren() {
        if (mediaPlayer?.isPlaying == true) return
        val alarmTone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        mediaPlayer = MediaPlayer().apply {
            setDataSource(applicationContext, alarmTone)
            isLooping = true
            setVolume(1.0f, 1.0f)
            prepare()
            start()
        }
    }

    private fun stopSiren() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }

    private fun buildForegroundNotification(alertId: String?): Notification {
        val stopIntent = PendingIntent.getBroadcast(
            this,
            0,
            AlertActionsReceiver.createStopSirenIntent(this, alertId ?: ""),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, AlertNotificationManager.SILENT_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_alert_buoy)
            .setContentTitle(getString(R.string.siren_service_title))
            .setContentText(getString(R.string.siren_service_description))
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(R.drawable.ic_stop, getString(R.string.alert_notification_stop_action), stopIntent)
            .build()
    }

    companion object {
        private const val EXTRA_ALERT_ID = "extra_alert_id"
        private const val NOTIFICATION_ID = 42

        fun start(context: Context, alertId: String) {
            val intent = Intent(context, SirenService::class.java).apply {
                putExtra(EXTRA_ALERT_ID, alertId)
            }
            NotificationManagerCompat.from(context)
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, SirenService::class.java))
        }
    }
}
