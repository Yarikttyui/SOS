package com.bashbosh.rescue.domain.model

data class RescueUser(
    val id: String,
    val email: String,
    val phone: String?,
    val fullName: String?,
    val role: UserRole,
    val teamId: String?,
    val teamName: String?,
    val isTeamLeader: Boolean,
    val isSharedAccount: Boolean,
    val isActive: Boolean,
    val isVerified: Boolean,
    val specialization: String?,
    val createdAt: String?
)

enum class UserRole(val raw: String) {
    CITIZEN("citizen"),
    RESCUER("rescuer"),
    OPERATOR("operator"),
    COORDINATOR("coordinator"),
    ADMIN("admin"),
    UNKNOWN("unknown");

    companion object {
        fun from(value: String?): UserRole = values().firstOrNull { it.raw == value } ?: UNKNOWN
    }
}


data class AuthTokens(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String
)


data class UserSession(
    val tokens: AuthTokens?,
    val user: RescueUser?,
    val isLoggedIn: Boolean = tokens != null && user != null
)
