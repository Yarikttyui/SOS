package com.bashbosh.rescue.data.dto

import com.google.gson.annotations.SerializedName


data class NotificationDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("type") val type: String,
    @SerializedName("title") val title: String,
    @SerializedName("message") val message: String,
    @SerializedName("is_read") val isRead: Boolean,
    @SerializedName("alert_id") val alertId: String?,
    @SerializedName("team_id") val teamId: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("read_at") val readAt: String?
)

data class NotificationUpdateRequest(
    @SerializedName("is_read") val isRead: Boolean
)
