package com.bashbosh.rescue.data.preferences

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.bashbosh.rescue.domain.model.AuthTokens
import com.bashbosh.rescue.domain.model.RescueUser
import com.bashbosh.rescue.domain.model.UserRole
import com.bashbosh.rescue.domain.model.UserSession
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import java.io.IOException

private const val DATA_STORE_NAME = "rescue_prefs"

private val Context.dataStore by preferencesDataStore(name = DATA_STORE_NAME)

class UserPreferencesDataSource(private val context: Context) {

    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val TOKEN_TYPE = stringPreferencesKey("token_type")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val USER_PHONE = stringPreferencesKey("user_phone")
        val USER_NAME = stringPreferencesKey("user_name")
        val USER_ROLE = stringPreferencesKey("user_role")
        val TEAM_ID = stringPreferencesKey("team_id")
        val TEAM_NAME = stringPreferencesKey("team_name")
        val IS_TEAM_LEADER = stringPreferencesKey("is_team_leader")
        val IS_SHARED_ACCOUNT = stringPreferencesKey("is_shared_account")
        val IS_ACTIVE = stringPreferencesKey("is_active")
        val IS_VERIFIED = stringPreferencesKey("is_verified")
        val SPECIALIZATION = stringPreferencesKey("specialization")
        val CREATED_AT = stringPreferencesKey("created_at")
    }

    val session: Flow<UserSession> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs -> prefs.toSession() }

    suspend fun updateTokens(accessToken: String, refreshToken: String, tokenType: String = "bearer") {
        context.dataStore.edit { prefs ->
            prefs[Keys.ACCESS_TOKEN] = accessToken
            prefs[Keys.REFRESH_TOKEN] = refreshToken
            prefs[Keys.TOKEN_TYPE] = tokenType
        }
    }

    suspend fun updateUser(user: RescueUser) {
        context.dataStore.edit { prefs ->
            prefs[Keys.USER_ID] = user.id
            prefs[Keys.USER_EMAIL] = user.email
            prefs[Keys.USER_PHONE] = user.phone ?: ""
            prefs[Keys.USER_NAME] = user.fullName ?: ""
            prefs[Keys.USER_ROLE] = user.role.raw
            prefs[Keys.TEAM_ID] = user.teamId ?: ""
            prefs[Keys.TEAM_NAME] = user.teamName ?: ""
            prefs[Keys.IS_TEAM_LEADER] = user.isTeamLeader.toString()
            prefs[Keys.IS_SHARED_ACCOUNT] = user.isSharedAccount.toString()
            prefs[Keys.IS_ACTIVE] = user.isActive.toString()
            prefs[Keys.IS_VERIFIED] = user.isVerified.toString()
            prefs[Keys.SPECIALIZATION] = user.specialization ?: ""
            prefs[Keys.CREATED_AT] = user.createdAt ?: ""
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    suspend fun getAccessToken(): String? = context.dataStore.data
        .map { it[Keys.ACCESS_TOKEN] }
        .catch { emit(null) }
        .firstOrNull()

    suspend fun getRefreshToken(): String? = context.dataStore.data
        .map { it[Keys.REFRESH_TOKEN] }
        .catch { emit(null) }
        .firstOrNull()

    private fun Preferences.toSession(): UserSession {
        val access = this[Keys.ACCESS_TOKEN]
        val refresh = this[Keys.REFRESH_TOKEN]
        val tokenType = this[Keys.TOKEN_TYPE] ?: "bearer"

        val tokens = if (!access.isNullOrBlank() && !refresh.isNullOrBlank()) {
            AuthTokens(access, refresh, tokenType)
        } else null

        val userId = this[Keys.USER_ID]
        val userEmail = this[Keys.USER_EMAIL]

        val user = if (!userId.isNullOrBlank() && !userEmail.isNullOrBlank()) {
            RescueUser(
                id = userId,
                email = userEmail,
                phone = this[Keys.USER_PHONE]?.takeIf { it.isNotBlank() },
                fullName = this[Keys.USER_NAME]?.takeIf { it.isNotBlank() },
                role = UserRole.from(this[Keys.USER_ROLE]),
                teamId = this[Keys.TEAM_ID]?.takeIf { it.isNotBlank() },
                teamName = this[Keys.TEAM_NAME]?.takeIf { it.isNotBlank() },
                isTeamLeader = this[Keys.IS_TEAM_LEADER]?.toBooleanStrictOrNull() ?: false,
                isSharedAccount = this[Keys.IS_SHARED_ACCOUNT]?.toBooleanStrictOrNull() ?: false,
                isActive = this[Keys.IS_ACTIVE]?.toBooleanStrictOrNull() ?: true,
                isVerified = this[Keys.IS_VERIFIED]?.toBooleanStrictOrNull() ?: false,
                specialization = this[Keys.SPECIALIZATION]?.takeIf { it.isNotBlank() },
                createdAt = this[Keys.CREATED_AT]?.takeIf { it.isNotBlank() }
            )
        } else null

        return UserSession(
            tokens = tokens,
            user = user,
            isLoggedIn = tokens != null && user != null
        )
    }
}
