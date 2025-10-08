package com.bashbosh.rescue.data.repository

import com.bashbosh.rescue.data.datasource.ApiService
import com.bashbosh.rescue.data.dto.LoginRequest
import com.bashbosh.rescue.data.dto.RefreshRequest
import com.bashbosh.rescue.data.dto.RegisterRequest
import com.bashbosh.rescue.data.mapper.toAuthTokens
import com.bashbosh.rescue.data.mapper.toDomain
import com.bashbosh.rescue.data.preferences.UserPreferencesDataSource
import com.bashbosh.rescue.domain.model.AuthTokens
import com.bashbosh.rescue.domain.model.RescueUser
import com.bashbosh.rescue.domain.model.UserSession
import kotlinx.coroutines.flow.Flow

class AuthRepository(
    private val apiService: ApiService,
    private val preferences: UserPreferencesDataSource
) {

    val session: Flow<UserSession> = preferences.session

    suspend fun login(email: String, password: String): Result<UserSession> = runCatching {
        val response = apiService.login(LoginRequest(email = email, password = password))
        val tokens = response.toAuthTokens()
        preferences.updateTokens(tokens.accessToken, tokens.refreshToken, tokens.tokenType)

        val userDto = response.user ?: apiService.getCurrentUser()
        val user = userDto.toDomain()
        preferences.updateUser(user)

        UserSession(tokens, user, isLoggedIn = true)
    }

    suspend fun register(email: String, password: String, fullName: String?, phone: String?): Result<RescueUser> = runCatching {
        val userDto = apiService.register(
            RegisterRequest(email = email, password = password, fullName = fullName, phone = phone)
        )
        val user = userDto.toDomain()
        preferences.updateUser(user)
        user
    }

    suspend fun refreshToken(): Result<AuthTokens> = runCatching {
        val refresh = preferences.getRefreshToken() ?: throw IllegalStateException("Missing refresh token")
        val response = apiService.refresh(RefreshRequest(refresh))
        val tokens = response.toAuthTokens()
        preferences.updateTokens(tokens.accessToken, tokens.refreshToken, tokens.tokenType)
        tokens
    }

    suspend fun loadCurrentUser(force: Boolean = false): Result<RescueUser> = runCatching {
        val current = apiService.getCurrentUser().toDomain()
        preferences.updateUser(current)
        current
    }

    suspend fun logout() {
        preferences.clear()
    }
}
