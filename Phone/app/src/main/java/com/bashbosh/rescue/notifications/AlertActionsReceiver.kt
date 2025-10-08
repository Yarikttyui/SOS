package com.bashbosh.rescue.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlertActionsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == ACTION_STOP_SIREN) {
            val alertId = intent.getStringExtra(EXTRA_ALERT_ID)
            if (alertId != null) {
                AlertNotificationManager(context).cancelAlert(alertId)
            } else {
                SirenService.stop(context)
            }
        }
    }

    companion object {
        const val ACTION_STOP_SIREN = "com.bashbosh.rescue.action.STOP_SIREN"
        private const val EXTRA_ALERT_ID = "extra_alert_id"

        fun createStopSirenIntent(context: Context, alertId: String): Intent = Intent(context, AlertActionsReceiver::class.java).apply {
            action = ACTION_STOP_SIREN
            putExtra(EXTRA_ALERT_ID, alertId)
        }
    }
}
