package com.bashbosh.rescue.data.dto

import com.google.gson.annotations.SerializedName


data class AlertDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("type") val type: String,
    @SerializedName("status") val status: String,
    @SerializedName("priority") val priority: Int,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("address") val address: String?,
    @SerializedName("title") val title: String?,
    @SerializedName("description") val description: String?,
    @SerializedName("media_urls") val mediaUrls: List<String>?,
    @SerializedName("ai_analysis") val aiAnalysis: Map<String, Any>?,
    @SerializedName("assigned_to") val assignedTo: String?,
    @SerializedName("team_id") val teamId: String?,
    @SerializedName("assigned_to_name") val assignedToName: String?,
    @SerializedName("team_name") val teamName: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String?,
    @SerializedName("assigned_at") val assignedAt: String?,
    @SerializedName("completed_at") val completedAt: String?
)

data class AlertUpdateRequest(
    @SerializedName("status") val status: String? = null,
    @SerializedName("description") val description: String? = null
)
