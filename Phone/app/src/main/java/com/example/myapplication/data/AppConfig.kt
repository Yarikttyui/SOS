package com.example.myapplication.data

import com.example.myapplication.BuildConfig

object AppConfig {

    private fun sanitizeBase(url: String): String {
        return url.trimEnd('/')
    }

    val apiBaseUrl: String
        get() = sanitizeBase(BuildConfig.API_BASE_URL) + "/api/v1/"

    val websocketUrl: String
        get() = sanitizeBase(BuildConfig.WS_BASE_URL) + "/api/v1/ws"

    val androidDownloadUrl: String
        get() = sanitizeBase(BuildConfig.API_BASE_URL) + "/api/v1/downloads/android"
}
