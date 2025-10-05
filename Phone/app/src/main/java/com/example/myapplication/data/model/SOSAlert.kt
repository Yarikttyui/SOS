package com.example.myapplication.data.model

data class SOSAlert(
    val id: String,
    val user_id: String,
    val type: String,
    val status: String,
    val priority: String? = null,
    val latitude: Double,
    val longitude: Double,
    val address: String? = null,
    val title: String? = null,
    val description: String? = null,
    val media_urls: List<String>? = null,
    val ai_analysis: Map<String, Any>? = null,
    val assigned_to: String? = null,
    val team_id: String? = null,
    val created_at: String,
    val updated_at: String,
    val assigned_at: String? = null,
    val completed_at: String? = null,
    val assigned_to_name: String? = null,
    val team_name: String? = null
)

data class CreateAlertRequest(
    val type: String,
    val latitude: Double,
    val longitude: Double,
    val title: String,
    val description: String,
    val address: String? = null,
    val media_urls: List<String>? = null
)

data class UpdateAlertRequest(
    val status: String? = null,
    val team_id: String? = null
)
