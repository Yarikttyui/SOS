package com.example.myapplication.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.myapplication.data.model.User
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "rescue_prefs")

class PreferencesManager(private val context: Context) {
    
    private val gson = Gson()
    
    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
        private val USER_KEY = stringPreferencesKey("user")
    }
    
    val accessToken: Flow<String?> = context.dataStore.data
        .map { preferences ->
            preferences[ACCESS_TOKEN_KEY]
        }
    
    val refreshToken: Flow<String?> = context.dataStore.data
        .map { preferences ->
            preferences[REFRESH_TOKEN_KEY]
        }
    
    val user: Flow<User?> = context.dataStore.data
        .map { preferences ->
            preferences[USER_KEY]?.let { json ->
                try {
                    gson.fromJson(json, User::class.java)
                } catch (e: Exception) {
                    null
                }
            }
        }
    
    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        context.dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = accessToken
            preferences[REFRESH_TOKEN_KEY] = refreshToken
        }
    }
    
    suspend fun saveUser(user: User) {
        context.dataStore.edit { preferences ->
            preferences[USER_KEY] = gson.toJson(user)
        }
    }
    
    suspend fun clear() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
