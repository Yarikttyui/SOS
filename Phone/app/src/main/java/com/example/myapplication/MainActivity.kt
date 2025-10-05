package com.example.myapplication

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.myapplication.data.api.RetrofitClient
import com.example.myapplication.data.model.*
import com.example.myapplication.data.preferences.PreferencesManager
import com.example.myapplication.service.AlertNotificationService
import com.example.myapplication.service.AlertSoundManager
import com.example.myapplication.service.LocationManager
import com.example.myapplication.ui.screen.LoginScreen
import com.example.myapplication.ui.screen.RescuerDashboard
import com.example.myapplication.ui.screen.CitizenDashboard
import com.example.myapplication.ui.theme.MyApplicationTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var alertSoundManager: AlertSoundManager
    internal lateinit var locationManager: LocationManager
    
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Toast.makeText(this, "Разрешите уведомления для получения вызовов", Toast.LENGTH_LONG).show()
        }
    }
    
    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true -> {
                Toast.makeText(this, "Доступ к местоположению разрешен", Toast.LENGTH_SHORT).show()
                startLocationTracking()
            }
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true -> {
                Toast.makeText(this, "Доступ к приблизительному местоположению разрешен", Toast.LENGTH_SHORT).show()
                startLocationTracking()
            }
            else -> {
                Toast.makeText(this, "Разрешите доступ к местоположению для точного определения координат", Toast.LENGTH_LONG).show()
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        preferencesManager = PreferencesManager(this)
        alertSoundManager = AlertSoundManager(this)
        locationManager = LocationManager(this)
        
        // Request notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        
        // Request location permissions
        requestLocationPermissions()
        
        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RescueApp(
                        preferencesManager = preferencesManager,
                        alertSoundManager = alertSoundManager
                    )
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        alertSoundManager.release()
        locationManager.stopLocationUpdates()
    }
    
    fun requestLocationPermissions() {
        if (!locationManager.hasLocationPermission()) {
            locationPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        } else {
            startLocationTracking()
        }
    }
    
    private fun startLocationTracking() {
        locationManager.startLocationUpdates { lat, lon ->
            android.util.Log.d("MainActivity", "🌍 Location updated from GPS: $lat, $lon")
            currentLocation = Pair(lat, lon)
            android.util.Log.d("MainActivity", "✅ Current location saved: $currentLocation")
        }
    }
}

@Composable
fun RescueApp(
    preferencesManager: PreferencesManager,
    alertSoundManager: AlertSoundManager
) {
    var isLoggedIn by remember { mutableStateOf(false) }
    var currentUser by remember { mutableStateOf<User?>(null) }
    var accessToken by remember { mutableStateOf<String?>(null) }
    var alerts by remember { mutableStateOf<List<SOSAlert>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var currentLocation by remember { mutableStateOf<Pair<Double, Double>?>(null) }
    
    val scope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current
    val activity = context as? MainActivity
    
    // Track location
    LaunchedEffect(Unit) {
        activity?.locationManager?.startLocationUpdates { lat, lon ->
            currentLocation = Pair(lat, lon)
        }
    }
    
    // Check if user is already logged in
    LaunchedEffect(Unit) {
        val token = preferencesManager.accessToken.first()
        val user = preferencesManager.user.first()
        
        if (token != null && user != null) {
            accessToken = token
            currentUser = user
            isLoggedIn = true
            
            // Request location permissions for citizens
            if (user.role == "citizen") {
                activity?.requestLocationPermissions()
            }
            
            // Start notification service only for rescuers
            if (user.role == "rescuer") {
                try {
                    AlertNotificationService.start(context, user.id, token)
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "Failed to start notification service", e)
                    Toast.makeText(context, "Ошибка запуска сервиса: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
        
        isLoading = false
    }
    
    // Load alerts when logged in
    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn && accessToken != null) {
            loadAlerts(accessToken!!) { result ->
                result.onSuccess { alerts = it }
            }
        }
    }
    
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    } else if (!isLoggedIn) {
        LoginScreen(
            onLoginSuccess = { isLoggedIn = true },
            onLogin = { email, password, onSuccess, onError ->
                scope.launch {
                    val result = login(
                        email = email,
                        password = password,
                        preferencesManager = preferencesManager,
                        onSuccess = { token, user ->
                            accessToken = token
                            currentUser = user
                            
                            // Request location permissions for citizens
                            if (user.role == "citizen") {
                                activity?.requestLocationPermissions()
                            }
                            
                            // Start notification service only for rescuers
                            if (user.role == "rescuer") {
                                try {
                                    AlertNotificationService.start(context, user.id, token)
                                } catch (e: Exception) {
                                    android.util.Log.e("MainActivity", "Failed to start notification service", e)
                                    Toast.makeText(context, "Ошибка запуска сервиса: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    )
                    
                    result.onSuccess {
                        onSuccess()
                    }.onFailure { error ->
                        onError(error.message ?: "Ошибка входа")
                    }
                }
            }
        )
    } else if (currentUser != null) {
        // Show different dashboard based on user role
        when (currentUser!!.role) {
            "citizen" -> {
                CitizenDashboard(
                    user = currentUser!!,
                    onCreateAlert = { type, title, description ->
                        scope.launch {
                            android.util.Log.d("MainActivity", "📍 Creating alert...")
                            android.util.Log.d("MainActivity", "   currentLocation state: $currentLocation")
                            
                            // If no location yet, try to get current location immediately
                            val locationToUse = currentLocation ?: activity?.locationManager?.getCurrentLocation()
                            
                            android.util.Log.d("MainActivity", "   locationToUse (final): $locationToUse")
                            
                            if (locationToUse == null) {
                                android.util.Log.e("MainActivity", "⚠️ No location available! Alert will be created without coordinates")
                            } else {
                                android.util.Log.d("MainActivity", "✅ Sending alert with coordinates: ${locationToUse.first}, ${locationToUse.second}")
                            }
                            
                            createAlert(
                                accessToken!!,
                                type,
                                title,
                                description,
                                locationToUse,
                                onResult = { result ->
                                    result.onSuccess {
                                        Toast.makeText(context, "Вызов создан! Помощь уже в пути", Toast.LENGTH_LONG).show()
                                    }.onFailure {
                                        Toast.makeText(context, "Ошибка: ${it.message}", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            )
                        }
                    },
                    onLogout = {
                        scope.launch {
                            preferencesManager.clear()
                            isLoggedIn = false
                            currentUser = null
                            accessToken = null
                        }
                    }
                )
            }
            "rescuer" -> {
                RescuerDashboard(
                    user = currentUser!!,
                    alerts = alerts,
                    onAcceptAlert = { alertId ->
                        scope.launch {
                            acceptAlert(accessToken!!, alertId) { result ->
                                result.onSuccess {
                                    // Reload alerts
                                    loadAlerts(accessToken!!) { loadResult ->
                                        loadResult.onSuccess { alerts = it }
                                    }
                                    Toast.makeText(context, "Вызов принят", Toast.LENGTH_SHORT).show()
                                }.onFailure {
                                    Toast.makeText(context, "Ошибка: ${it.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    },
                    onCompleteAlert = { alertId ->
                        scope.launch {
                            completeAlert(accessToken!!, alertId) { result ->
                                result.onSuccess {
                                    // Reload alerts
                                    loadAlerts(accessToken!!) { loadResult ->
                                        loadResult.onSuccess { alerts = it }
                                    }
                                    Toast.makeText(context, "Вызов завершен", Toast.LENGTH_SHORT).show()
                                }.onFailure {
                                    Toast.makeText(context, "Ошибка: ${it.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    },
                    onRefresh = {
                        scope.launch {
                            loadAlerts(accessToken!!) { result ->
                                result.onSuccess { alerts = it }
                            }
                        }
                    },
                    onTestSiren = {
                        alertSoundManager.playAlertSound()
                        Toast.makeText(context, "Сирена запущена! Автоматически остановится через 30 сек", Toast.LENGTH_LONG).show()
                        
                        // Auto stop after 30 seconds
                        scope.launch {
                            kotlinx.coroutines.delay(30000)
                            alertSoundManager.stopAlertSound()
                        }
                    },
                    onLogout = {
                        scope.launch {
                            AlertNotificationService.stop(context)
                            preferencesManager.clear()
                            isLoggedIn = false
                            currentUser = null
                            accessToken = null
                            alerts = emptyList()
                        }
                    }
                )
            }
            else -> {
                // For operators, coordinators, admins - show message
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Роль: ${currentUser!!.role}",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text("Данная роль работает только через веб-интерфейс")
                        Button(onClick = {
                            scope.launch {
                                preferencesManager.clear()
                                isLoggedIn = false
                                currentUser = null
                                accessToken = null
                            }
                        }) {
                            Text("Выйти")
                        }
                    }
                }
            }
        }
    }
}

suspend fun login(
    email: String,
    password: String,
    preferencesManager: PreferencesManager,
    onSuccess: (String, User) -> Unit
): Result<Unit> {
    return try {
        val response = RetrofitClient.instance.login(
            LoginRequest(email = email, password = password)
        )
        
        if (response.isSuccessful && response.body() != null) {
            val loginResponse = response.body()!!
            
            preferencesManager.saveTokens(
                loginResponse.access_token,
                loginResponse.refresh_token
            )
            preferencesManager.saveUser(loginResponse.user)
            
            onSuccess(loginResponse.access_token, loginResponse.user)
            
            Result.success(Unit)
        } else {
            Result.failure(Exception("Неверный email или пароль"))
        }
    } catch (e: Exception) {
        Result.failure(Exception("Ошибка сети: ${e.message}"))
    }
}

suspend fun loadAlerts(
    token: String,
    onResult: (Result<List<SOSAlert>>) -> Unit
) {
    try {
        val response = RetrofitClient.instance.getAlerts("Bearer $token")
        
        if (response.isSuccessful && response.body() != null) {
            onResult(Result.success(response.body()!!))
        } else {
            onResult(Result.failure(Exception("Ошибка загрузки вызовов")))
        }
    } catch (e: Exception) {
        onResult(Result.failure(e))
    }
}

suspend fun acceptAlert(
    token: String,
    alertId: String,
    onResult: (Result<SOSAlert>) -> Unit
) {
    try {
        val response = RetrofitClient.instance.updateAlert(
            "Bearer $token",
            alertId,
            UpdateAlertRequest(status = "in_progress")
        )
        
        if (response.isSuccessful && response.body() != null) {
            onResult(Result.success(response.body()!!))
        } else {
            onResult(Result.failure(Exception("Не удалось принять вызов")))
        }
    } catch (e: Exception) {
        onResult(Result.failure(e))
    }
}

suspend fun createAlert(
    token: String,
    type: String,
    title: String,
    description: String,
    location: Pair<Double, Double>?,
    onResult: (Result<SOSAlert>) -> Unit
) {
    try {
        android.util.Log.d("createAlert", "📤 Received location parameter: $location")
        
        val (latitude, longitude) = location ?: Pair(56.8587, 35.9176) // Default: Tver
        
        android.util.Log.d("createAlert", "🌍 Final coordinates to send: lat=$latitude, lon=$longitude")
        
        val response = RetrofitClient.instance.createAlert(
            "Bearer $token",
            CreateAlertRequest(
                type = type,
                latitude = latitude,
                longitude = longitude,
                title = title,
                description = description,
                address = if (location != null) "Координаты: $latitude, $longitude" else "Местоположение определяется..."
            )
        )
        
        android.util.Log.d("createAlert", "📨 API Response code: ${response.code()}")
        
        if (response.isSuccessful && response.body() != null) {
            android.util.Log.d("createAlert", "✅ Alert created successfully: ${response.body()}")
            onResult(Result.success(response.body()!!))
        } else {
            android.util.Log.e("createAlert", "❌ Failed to create alert: ${response.errorBody()?.string()}")
            onResult(Result.failure(Exception("Не удалось создать вызов")))
        }
    } catch (e: Exception) {
        android.util.Log.e("createAlert", "💥 Exception: ${e.message}", e)
        onResult(Result.failure(Exception("Ошибка сети: ${e.message}")))
    }
}

suspend fun completeAlert(
    token: String,
    alertId: String,
    onResult: (Result<SOSAlert>) -> Unit
) {
    try {
        val response = RetrofitClient.instance.updateAlert(
            "Bearer $token",
            alertId,
            UpdateAlertRequest(status = "completed")
        )
        
        if (response.isSuccessful && response.body() != null) {
            onResult(Result.success(response.body()!!))
        } else {
            onResult(Result.failure(Exception("Не удалось завершить вызов")))
        }
    } catch (e: Exception) {
        onResult(Result.failure(e))
    }
}
