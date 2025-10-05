package com.example.myapplication.data.model

data class User(
    val id: String,
    val email: String,
    val full_name: String,
    val role: String,
    val phone: String? = null,
    val specialization: String? = null,
    val team_id: String? = null,
    val team_name: String? = null,
    val is_team_leader: Boolean = false,
    val is_active: Boolean = true,
    val is_verified: Boolean = false,
    val created_at: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val access_token: String,
    val refresh_token: String,
    val token_type: String,
    val user: User
)
