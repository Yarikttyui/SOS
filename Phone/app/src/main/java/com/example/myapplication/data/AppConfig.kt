package com.example.myapplication.data

import android.util.Log
import com.example.myapplication.BuildConfig
import java.net.InetAddress
import java.net.URI

object AppConfig {

    private const val TAG = "AppConfig"
    private const val LOCAL_DEFAULT_BASE = "http://10.0.2.2:8000"

    private fun sanitizeBase(url: String?): String? {
        return url
            ?.trim()
            ?.trimEnd('/')
            ?.takeIf { it.isNotBlank() }
    }

    private fun convertHttpToWebSocket(url: String): String {
        return when {
            url.startsWith("https", ignoreCase = true) -> url.replaceFirst("https", "wss", ignoreCase = true)
            url.startsWith("http", ignoreCase = true) -> url.replaceFirst("http", "ws", ignoreCase = true)
            else -> url
        }
    }

    private fun isHostResolvable(url: String): Boolean {
        return try {
            val host = URI(url).host ?: return false
            // Short circuit if host already an IP address
            if (host.matches(Regex("^\\d{1,3}(\\.\\d{1,3}){3}") )) {
                return true
            }
            InetAddress.getByName(host)
            true
        } catch (ex: Exception) {
            Log.w(TAG, "Host resolve failed for $url: ${ex.message}")
            false
        }
    }

    private fun resolveBase(primary: String?, fallback: String?): String {
        val candidates = buildList {
            if (!primary.isNullOrBlank()) add(primary)
            if (!fallback.isNullOrBlank() && fallback != primary) add(fallback)
            if (isEmpty()) add(LOCAL_DEFAULT_BASE)
        }

        val chosen = candidates.firstOrNull { isHostResolvable(it) } ?: candidates.first()
        if (chosen != candidates.first()) {
            Log.i(TAG, "Using fallback base URL: $chosen")
        }
        return chosen
    }

    private val resolvedApiBase: String by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        val primary = sanitizeBase(BuildConfig.API_BASE_URL)
        val fallback = sanitizeBase(BuildConfig.API_FALLBACK_URL)
        resolveBase(primary, fallback)
    }

    private val resolvedWebSocketBase: String by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        val explicitPrimary = sanitizeBase(BuildConfig.WS_BASE_URL)
        val explicitFallback = sanitizeBase(BuildConfig.WS_FALLBACK_URL)

        val fallbackFromApi = convertHttpToWebSocket(resolvedApiBase)
        resolveBase(explicitPrimary ?: fallbackFromApi, explicitFallback ?: fallbackFromApi)
    }

    val apiBaseUrl: String
        get() = resolvedApiBase.trimEnd('/') + "/api/v1/"

    val websocketUrl: String
        get() = resolvedWebSocketBase.trimEnd('/') + "/api/v1/ws"

    val androidDownloadUrl: String
        get() = resolvedApiBase.trimEnd('/') + "/api/v1/downloads/android"
}
