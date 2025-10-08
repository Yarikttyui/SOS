package com.bashbosh.rescue.domain.model

import java.time.OffsetDateTime


data class AlertNotification(
    val id: String,
    val userId: String,
    val type: NotificationType,
    val title: String,
    val message: String,
    val isRead: Boolean,
    val alertId: String?,
    val teamId: String?,
    val createdAt: OffsetDateTime?,
    val readAt: OffsetDateTime?
)

enum class NotificationType(val raw: String) {
    SOS_CREATED("sos_created"),
    SOS_ASSIGNED("sos_assigned"),
    SOS_UPDATED("sos_updated"),
    SOS_COMPLETED("sos_completed"),
    TEAM_ASSIGNED("team_assigned"),
    SYSTEM("system"),
    WARNING("warning"),
    INFO("info"),
    UNKNOWN("unknown");

    companion object {
        fun from(value: String?): NotificationType = values().firstOrNull { it.raw == value } ?: UNKNOWN
    }
}
