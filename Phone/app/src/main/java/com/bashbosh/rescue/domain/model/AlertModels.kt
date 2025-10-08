package com.bashbosh.rescue.domain.model

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter


data class Alert(
    val id: String,
    val userId: String,
    val type: EmergencyType,
    val status: AlertStatus,
    val priority: Int,
    val latitude: Double,
    val longitude: Double,
    val address: String?,
    val title: String?,
    val description: String?,
    val mediaUrls: List<String>,
    val aiAnalysis: Map<String, Any>?,
    val assignedTo: String?,
    val teamId: String?,
    val assignedToName: String?,
    val teamName: String?,
    val createdAt: OffsetDateTime?,
    val updatedAt: OffsetDateTime?,
    val assignedAt: OffsetDateTime?,
    val completedAt: OffsetDateTime?
) {
    val isCompleted: Boolean get() = status == AlertStatus.COMPLETED
    val isInProgress: Boolean get() = status == AlertStatus.IN_PROGRESS
    val isAvailable: Boolean get() = status == AlertStatus.ASSIGNED && assignedTo == null

    val formattedCreatedAt: String?
        get() = createdAt?.format(DateTimeFormatter.ofPattern("dd MMM HH:mm"))
}

enum class EmergencyType(val raw: String) {
    FIRE("fire"),
    MEDICAL("medical"),
    POLICE("police"),
    WATER_RESCUE("water_rescue"),
    MOUNTAIN_RESCUE("mountain_rescue"),
    SEARCH_RESCUE("search_rescue"),
    ECOLOGICAL("ecological"),
    GENERAL("general"),
    UNKNOWN("unknown");

    companion object {
        fun from(value: String?): EmergencyType = values().firstOrNull { it.raw == value } ?: UNKNOWN
    }
}

enum class AlertStatus(val raw: String) {
    PENDING("pending"),
    ASSIGNED("assigned"),
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    UNKNOWN("unknown");

    companion object {
        fun from(value: String?): AlertStatus = values().firstOrNull { it.raw == value } ?: UNKNOWN
    }
}
