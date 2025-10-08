package com.bashbosh.rescue.data.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class RegisterRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("full_name") val fullName: String? = null,
    @SerializedName("phone") val phone: String? = null
)

data class RefreshRequest(
    @SerializedName("refresh_token") val refreshToken: String
)

data class TokenResponseDto(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("user") val user: UserDto? = null
)

data class UserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String?,
    @SerializedName("full_name") val fullName: String?,
    @SerializedName("role") val role: String,
    @SerializedName("team_id") val teamId: String?,
    @SerializedName("team_name") val teamName: String?,
    @SerializedName("is_team_leader") val isTeamLeader: Boolean,
    @SerializedName("is_shared_account") val isSharedAccount: Boolean,
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("is_verified") val isVerified: Boolean,
    @SerializedName("specialization") val specialization: String?,
    @SerializedName("created_at") val createdAt: String?
)
