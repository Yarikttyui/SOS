package com.bashbosh.rescue.data.mapper

import com.bashbosh.rescue.data.dto.AlertDto
import com.bashbosh.rescue.data.dto.NotificationDto
import com.bashbosh.rescue.data.dto.TokenResponseDto
import com.bashbosh.rescue.data.dto.UserDto
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.domain.model.AlertNotification
import com.bashbosh.rescue.domain.model.AlertStatus
import com.bashbosh.rescue.domain.model.AuthTokens
import com.bashbosh.rescue.domain.model.EmergencyType
import com.bashbosh.rescue.domain.model.NotificationType
import com.bashbosh.rescue.domain.model.RescueUser
import com.bashbosh.rescue.domain.model.UserRole
import java.time.OffsetDateTime
import java.time.format.DateTimeParseException

private fun parseDateTime(raw: String?): OffsetDateTime? = try {
    raw?.let(OffsetDateTime::parse)
} catch (ex: DateTimeParseException) {
    null
}

fun TokenResponseDto.toAuthTokens(): AuthTokens = AuthTokens(
    accessToken = accessToken,
    refreshToken = refreshToken,
    tokenType = tokenType
)

fun UserDto.toDomain(): RescueUser = RescueUser(
    id = id,
    email = email,
    phone = phone,
    fullName = fullName,
    role = UserRole.from(role),
    teamId = teamId,
    teamName = teamName,
    isTeamLeader = isTeamLeader,
    isSharedAccount = isSharedAccount,
    isActive = isActive,
    isVerified = isVerified,
    specialization = specialization,
    createdAt = createdAt
)

fun AlertDto.toDomain(): Alert = Alert(
    id = id,
    userId = userId,
    type = EmergencyType.from(type),
    status = AlertStatus.from(status),
    priority = priority,
    latitude = latitude,
    longitude = longitude,
    address = address,
    title = title,
    description = description,
    mediaUrls = mediaUrls ?: emptyList(),
    aiAnalysis = aiAnalysis,
    assignedTo = assignedTo,
    teamId = teamId,
    assignedToName = assignedToName,
    teamName = teamName,
    createdAt = parseDateTime(createdAt),
    updatedAt = parseDateTime(updatedAt),
    assignedAt = parseDateTime(assignedAt),
    completedAt = parseDateTime(completedAt)
)

fun NotificationDto.toDomain(): AlertNotification = AlertNotification(
    id = id,
    userId = userId,
    type = NotificationType.from(type),
    title = title,
    message = message,
    isRead = isRead,
    alertId = alertId,
    teamId = teamId,
    createdAt = parseDateTime(createdAt),
    readAt = parseDateTime(readAt)
)
