package com.example.myapplication.service

import android.util.Log
import com.example.myapplication.data.model.SOSAlert
import com.google.gson.Gson
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import okio.ByteString
import java.util.concurrent.TimeUnit

class WebSocketManager {
    
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    // WebSocket server URL
    // For emulator: use ws://10.0.2.2:8000
    // For real device: use your computer's IP address
    private val wsUrl = "ws://192.168.1.113:8000/api/v1/ws"
    
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState
    
    private val _newAlert = MutableStateFlow<SOSAlert?>(null)
    val newAlert: StateFlow<SOSAlert?> = _newAlert
    
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val gson = Gson()
    
    enum class ConnectionState {
        CONNECTED, DISCONNECTED, CONNECTING, ERROR
    }
    
    /**
     * Подключение к WebSocket серверу
     */
    fun connect(userId: String, token: String) {
        if (webSocket != null) {
            Log.d("WebSocketManager", "Already connected")
            return
        }
        
        _connectionState.value = ConnectionState.CONNECTING
        Log.d("WebSocketManager", "Connecting to: $wsUrl/$userId")
        
        val request = Request.Builder()
            .url("$wsUrl/$userId?token=$token")
            .build()
        
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("WebSocketManager", "✅ WebSocket connected successfully!")
                _connectionState.value = ConnectionState.CONNECTED
                
                // Send ping to keep connection alive
                scope.launch {
                    while (_connectionState.value == ConnectionState.CONNECTED) {
                        webSocket.send("{\"type\":\"ping\"}")
                        delay(30000) // 30 seconds
                    }
                }
            }
            
            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("WebSocketManager", "📩 Message received: $text")
                handleMessage(text)
            }
            
            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                Log.d("WebSocketManager", "Binary message received")
            }
            
            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("WebSocketManager", "WebSocket closing: $code / $reason")
                webSocket.close(1000, null)
                _connectionState.value = ConnectionState.DISCONNECTED
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("WebSocketManager", "WebSocket closed: $code / $reason")
                _connectionState.value = ConnectionState.DISCONNECTED
                
                // Попытка переподключения через 5 секунд
                scope.launch {
                    delay(5000)
                    if (_connectionState.value == ConnectionState.DISCONNECTED) {
                        Log.d("WebSocketManager", "Attempting to reconnect...")
                        connect(userId, token)
                    }
                }
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("WebSocketManager", "❌ WebSocket connection failed: ${t.message}", t)
                Log.e("WebSocketManager", "Response: ${response?.message}")
                _connectionState.value = ConnectionState.ERROR
                
                // Попытка переподключения через 10 секунд
                scope.launch {
                    delay(10000)
                    Log.d("WebSocketManager", "🔄 Attempting to reconnect after failure...")
                    connect(userId, token)
                }
            }
        })
    }
    
    /**
     * Обработка входящего сообщения
     */
    private fun handleMessage(text: String) {
        try {
            Log.d("WebSocketManager", "🔍 Parsing message: $text")
            val message = gson.fromJson(text, WebSocketMessage::class.java)
            
            when (message.type) {
                "new_alert" -> {
                    Log.d("WebSocketManager", "🚨 NEW ALERT received!")
                    message.data?.let { data ->
                        val alert = gson.fromJson(gson.toJson(data), SOSAlert::class.java)
                        _newAlert.value = alert
                        Log.d("WebSocketManager", "Alert details: id=${alert.id}, type=${alert.type}, status=${alert.status}")
                    }
                }
                "alert_updated" -> {
                    Log.d("WebSocketManager", "📝 Alert update received")
                    message.data?.let { data ->
                        val alert = gson.fromJson(gson.toJson(data), SOSAlert::class.java)
                        _newAlert.value = alert
                        Log.d("WebSocketManager", "Alert updated: ${alert.id}")
                    }
                }
                "ping" -> {
                    Log.d("WebSocketManager", "🏓 Ping received, sending pong")
                    sendPong()
                }
                "pong" -> {
                    Log.d("WebSocketManager", "🏓 Pong received")
                }
                else -> {
                    Log.d("WebSocketManager", "❓ Unknown message type: ${message.type}")
                }
            }
        } catch (e: Exception) {
            Log.e("WebSocketManager", "❌ Error handling message: ${e.message}", e)
        }
    }
    
    /**
     * Отправка pong в ответ на ping
     */
    private fun sendPong() {
        webSocket?.send("""{"type":"pong"}""")
    }
    
    /**
     * Отключение от WebSocket
     */
    fun disconnect() {
        webSocket?.close(1000, "User disconnect")
        webSocket = null
        _connectionState.value = ConnectionState.DISCONNECTED
        scope.cancel()
    }
    
    /**
     * Отправка сообщения
     */
    fun sendMessage(message: String) {
        webSocket?.send(message)
    }
    
    data class WebSocketMessage(
        val type: String,
        val data: Any? = null
    )
}
