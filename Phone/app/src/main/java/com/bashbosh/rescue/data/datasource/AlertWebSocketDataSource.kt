package com.bashbosh.rescue.data.datasource

import android.util.Log
import com.bashbosh.rescue.BuildConfig
import com.bashbosh.rescue.data.dto.AlertDto
import com.bashbosh.rescue.data.dto.WebSocketMessageDto
import com.google.gson.Gson
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import java.util.concurrent.TimeUnit
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

class AlertWebSocketDataSource(
    private val gson: Gson = Gson(),
    client: OkHttpClient? = null
) {

    private val okHttpClient: OkHttpClient = client ?: OkHttpClient.Builder()
        .pingInterval(15, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .build()

    fun observeAlerts(userId: String, token: String): Flow<AlertDto> = callbackFlow {
        val baseUrl = resolveBaseUrl()
        val httpUrl = baseUrl.toHttpUrlOrNull()?.newBuilder()
            ?.addPathSegments("api/v1/ws/$userId")
            ?.addQueryParameter("token", token)
            ?.build()

        if (httpUrl == null) {
            close(IllegalArgumentException("Invalid WebSocket URL"))
            return@callbackFlow
        }

        val request = Request.Builder().url(httpUrl).build()

        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket opened: ${httpUrl}")
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure", t)
                close(t)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val message = gson.fromJson(text, WebSocketMessageDto::class.java)
                    val alert = message.data
                    if (alert != null) {
                        trySend(alert)
                    }
                } catch (ex: Exception) {
                    Log.e(TAG, "Failed to parse WebSocket message", ex)
                }
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                onMessage(webSocket, bytes.utf8())
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closing: $code | $reason")
                webSocket.close(code, reason)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code | $reason")
            }
        }

        val socket = okHttpClient.newWebSocket(request, listener)

        awaitClose {
            socket.cancel()
        }
    }

    private fun resolveBaseUrl(): String {
        val primary = BuildConfig.WS_BASE_URL.ifBlank { "ws://10.0.2.2:8000" }
        return if (primary.endsWith('/')) primary.dropLast(1) else primary
    }

    companion object {
        private const val TAG = "AlertWebSocket"
    }
}
