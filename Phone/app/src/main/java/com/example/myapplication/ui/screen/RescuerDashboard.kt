package com.example.myapplication.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.model.SOSAlert
import com.example.myapplication.data.model.User

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RescuerDashboard(
    user: User,
    alerts: List<SOSAlert>,
    onAcceptAlert: (String) -> Unit,
    onCompleteAlert: (String) -> Unit,
    onRefresh: () -> Unit,
    onTestSiren: () -> Unit,
    onLogout: () -> Unit
) {
    var activeTab by remember { mutableStateOf("my") }
    var showTestDialog by remember { mutableStateOf(false) }
    var lastUpdateTime by remember { mutableStateOf(System.currentTimeMillis()) }
    var isRefreshing by remember { mutableStateOf(false) }
    
    // Автоматическое обновление каждые 10 секунд
    LaunchedEffect(Unit) {
        while(true) {
            kotlinx.coroutines.delay(10000) // 10 секунд
            onRefresh()
            lastUpdateTime = System.currentTimeMillis()
        }
    }
    
    // Filter alerts based on active tab
    val myAlerts = alerts.filter { alert ->
        alert.assigned_to == user.id && alert.status != "completed" && alert.status != "cancelled"
    }
    
    val teamAlerts = if (user.team_id != null) {
        alerts.filter { alert ->
            alert.team_id == user.team_id && 
            alert.status != "completed" && 
            alert.status != "cancelled"
        }
    } else {
        emptyList()
    }
    
    val availableAlerts = alerts.filter { alert ->
        alert.status == "assigned" && 
        (alert.team_id == null || alert.team_id == user.team_id) &&
        alert.assigned_to == null
    }
    
    val filteredAlerts = when(activeTab) {
        "my" -> myAlerts
        "team" -> teamAlerts
        "available" -> availableAlerts
        else -> emptyList()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Спасатель", fontSize = 18.sp)
                        Text(
                            text = user.full_name ?: user.email,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                },
                actions = {
                    // Refresh button
                    IconButton(
                        onClick = {
                            isRefreshing = true
                            onRefresh()
                            lastUpdateTime = System.currentTimeMillis()
                            isRefreshing = false
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Обновить",
                            tint = if (isRefreshing) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                        )
                    }
                    // Test siren button
                    IconButton(onClick = { showTestDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.VolumeUp,
                            contentDescription = "Тест сирены",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Выход"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Team badge if user is in a team
            if (user.team_id != null && user.team_name != null) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = Color(0xFF3B82F6).copy(alpha = 0.1f)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Group,
                            contentDescription = null,
                            tint = Color(0xFF3B82F6)
                        )
                        Text(
                            text = user.team_name,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF3B82F6)
                        )
                        if (user.is_team_leader) {
                            Surface(
                                color = Color(0xFFF59E0B).copy(alpha = 0.2f),
                                shape = MaterialTheme.shapes.small
                            ) {
                                Text(
                                    text = "Лидер",
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    fontSize = 12.sp,
                                    color = Color(0xFFF59E0B),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
            
            // Statistics
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Мои задачи",
                    count = myAlerts.size,
                    color = Color(0xFF8B5CF6),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Команда",
                    count = teamAlerts.size,
                    color = Color(0xFF3B82F6),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Доступные",
                    count = availableAlerts.size,
                    color = Color(0xFFF59E0B),
                    modifier = Modifier.weight(1f)
                )
            }
            
            // Tabs
            TabRow(
                selectedTabIndex = when(activeTab) {
                    "my" -> 0
                    "team" -> 1
                    "available" -> 2
                    else -> 0
                }
            ) {
                Tab(
                    selected = activeTab == "my",
                    onClick = { activeTab = "my" },
                    text = { Text("Мои задачи") }
                )
                if (user.team_id != null) {
                    Tab(
                        selected = activeTab == "team",
                        onClick = { activeTab = "team" },
                        text = { Text("Команда") }
                    )
                }
                if (user.is_team_leader) {
                    Tab(
                        selected = activeTab == "available",
                        onClick = { activeTab = "available" },
                        text = { Text("Доступные") }
                    )
                }
            }
            
            // Alerts list
            if (filteredAlerts.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Нет вызовов",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredAlerts) { alert ->
                        AlertCard(
                            alert = alert,
                            onAccept = { onAcceptAlert(alert.id) },
                            onComplete = { onCompleteAlert(alert.id) },
                            canAccept = activeTab == "available" && user.is_team_leader,
                            canComplete = (activeTab == "my" || activeTab == "team") && 
                                         alert.status == "in_progress" && user.is_team_leader
                        )
                    }
                }
            }
        }
        
        // Test siren dialog
        if (showTestDialog) {
            AlertDialog(
                onDismissRequest = { showTestDialog = false },
                title = { Text("🚨 Тест сирены") },
                text = {
                    Column {
                        Text("Сирена будет воспроизводиться с максимальной громкостью!")
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Внимание: звук будет очень громким!",
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            onTestSiren()
                            showTestDialog = false
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Запустить")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showTestDialog = false }) {
                        Text("Отмена")
                    }
                }
            )
        }
    }
}

@Composable
fun StatCard(
    title: String,
    count: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count.toString(),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = title,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun AlertCard(
    alert: SOSAlert,
    onAccept: () -> Unit,
    onComplete: () -> Unit,
    canAccept: Boolean,
    canComplete: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = when(alert.type) {
                            "medical" -> Icons.Default.LocalHospital
                            "fire" -> Icons.Default.Fireplace
                            "accident" -> Icons.Default.CarCrash
                            else -> Icons.Default.Warning
                        },
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                    
                    Text(
                        text = alert.title ?: "Вызов",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                StatusBadge(status = alert.status)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Description
            if (alert.description != null) {
                Text(
                    text = alert.description,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Location
            if (alert.address != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = alert.address,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Team/Assigned info
            if (alert.team_name != null || alert.assigned_to_name != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (alert.team_name != null) {
                        Chip(text = "🚑 ${alert.team_name}")
                    }
                    if (alert.assigned_to_name != null) {
                        Chip(text = "👤 ${alert.assigned_to_name}")
                    }
                }
            }
            
            // Accept button
            if (canAccept) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onAccept,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Принять вызов")
                }
            }
            
            // Complete button
            if (canComplete) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onComplete,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF10B981)
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Завершить вызов")
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (text, color) = when(status) {
        "pending" -> "Ожидание" to Color(0xFFF59E0B)
        "assigned" -> "Назначен" to Color(0xFF3B82F6)
        "in_progress" -> "В работе" to Color(0xFF8B5CF6)
        "completed" -> "Завершен" to Color(0xFF10B981)
        "cancelled" -> "Отменен" to Color(0xFFEF4444)
        else -> status to Color.Gray
    }
    
    Surface(
        color = color.copy(alpha = 0.2f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            fontSize = 12.sp,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun Chip(text: String) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSecondaryContainer
        )
    }
}
