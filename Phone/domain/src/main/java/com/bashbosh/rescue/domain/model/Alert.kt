package com.bashbosh.rescue.domain.model

data class Alert(
    val id: String,
    val title: String,
    val description: String,
    val priority: AlertPriority,
    val status: AlertStatus,
    val createdAtIso: String,
    val latitude: Double?,
    val longitude: Double?,
    val address: String?
)

enum class AlertPriority { LOW, MEDIUM, HIGH }

enum class AlertStatus { NEW, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED }
