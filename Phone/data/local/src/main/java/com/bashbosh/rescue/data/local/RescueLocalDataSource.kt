package com.bashbosh.rescue.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class RescueLocalDataSource(
    private val dataStore: DataStore<Preferences>
) {
    private val authTokenKey = stringPreferencesKey("auth_token")

    val authToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[authTokenKey]
    }

    suspend fun saveAuthToken(token: String) {
        dataStore.edit { prefs ->
            prefs[authTokenKey] = token
        }
    }

    suspend fun clearAuthToken() {
        dataStore.edit { prefs ->
            prefs.remove(authTokenKey)
        }
    }
}
