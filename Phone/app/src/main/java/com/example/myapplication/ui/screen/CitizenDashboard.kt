package com.example.myapplication.ui.screen

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.model.User
import com.example.myapplication.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CitizenDashboard(
    user: User,
    onCreateAlert: (String, String, String) -> Unit,
    onLogout: () -> Unit
) {
    var showCreateDialog by remember { mutableStateOf(false) }
    var alertType by remember { mutableStateOf("medical") }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var showSuccessAnimation by remember { mutableStateOf(false) }
    
    // Pulse animation for SOS button
    val infiniteTransition = rememberInfiniteTransition(label = "sos_pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        EmergencyRedLight.copy(alpha = 0.1f),
                        Color.White
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Top Bar with User Info
            Card(
                modifier = Modifier
                    .fillMaxWidth(),
                shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp),
                colors = CardDefaults.cardColors(
                    containerColor = EmergencyRed
                ),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.3f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                            
                            Column {
                                Text(
                                    text = user.full_name,
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Гражданин",
                                    fontSize = 14.sp,
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                            }
                        }
                        
                        IconButton(
                            onClick = onLogout,
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.2f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = "Выход",
                                tint = Color.White
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Status Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color.White.copy(alpha = 0.2f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatusItem(
                                icon = Icons.Default.CheckCircle,
                                label = "Система",
                                value = "Активна",
                                iconTint = SuccessGreen
                            )
                            
                            Divider(
                                modifier = Modifier
                                    .height(48.dp)
                                    .width(1.dp),
                                color = Color.White.copy(alpha = 0.3f)
                            )
                            
                            StatusItem(
                                icon = Icons.Default.LocationOn,
                                label = "GPS",
                                value = "Включен",
                                iconTint = SuccessGreen
                            )
                        }
                    }
                }
            }
            
            // Main Content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Emergency SOS Button
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    shape = RoundedCornerShape(32.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White
                    ),
                    elevation = CardDefaults.cardElevation(16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Экстренный вызов",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray900
                        )
                        
                        Text(
                            text = "Нажмите для вызова помощи",
                            fontSize = 14.sp,
                            color = Gray600,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        // Giant SOS Button
                        Button(
                            onClick = { showCreateDialog = true },
                            modifier = Modifier
                                .size(200.dp)
                                .scale(scale),
                            shape = CircleShape,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = EmergencyRed,
                                contentColor = Color.White
                            ),
                            elevation = ButtonDefaults.buttonElevation(
                                defaultElevation = 16.dp,
                                pressedElevation = 24.dp
                            )
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Text(
                                    text = "SOS",
                                    fontSize = 56.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                                Text(
                                    text = "ВЫЗОВ",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp
                                )
                            }
                        }
                    }
                }
                
                // Quick Actions Grid
                Text(
                    text = "Типы экстренных ситуаций",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        icon = "🚑",
                        title = "Медицинская",
                        description = "Скорая помощь",
                        color = InfoBlue,
                        modifier = Modifier.weight(1f)
                    )
                    
                    QuickActionCard(
                        icon = "🔥",
                        title = "Пожар",
                        description = "Пожарная служба",
                        color = EmergencyRed,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        icon = "👮",
                        title = "Полиция",
                        description = "Правопорядок",
                        color = Color(0xFF4C1D95),
                        modifier = Modifier.weight(1f)
                    )
                    
                    QuickActionCard(
                        icon = "🌊",
                        title = "На воде",
                        description = "Водная служба",
                        color = Color(0xFF0EA5E9),
                        modifier = Modifier.weight(1f)
                    )
                }
                
                // Emergency Numbers Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Gray100
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "☎️ Экстренные службы",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gray900
                        )
                        
                        EmergencyNumberRow("101", "Пожарная охрана", EmergencyRed)
                        EmergencyNumberRow("102", "Полиция", Color(0xFF4C1D95))
                        EmergencyNumberRow("103", "Скорая помощь", InfoBlue)
                        EmergencyNumberRow("112", "Единый номер", EmergencyRedDark)
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
    
    // Create Alert Dialog
    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank() && description.isNotBlank()) {
                            onCreateAlert(alertType, title, description)
                            showCreateDialog = false
                            showSuccessAnimation = true
                            title = ""
                            description = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = EmergencyRed
                    )
                ) {
                    Text("Отправить SOS")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showCreateDialog = false }) {
                    Text("Отмена")
                }
            },
            title = {
                Text(
                    "🚨 Экстренный вызов",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Type Selector
                    Text("Тип ситуации:", fontWeight = FontWeight.Medium)
                    
                    // Emergency Types Grid
                    Column(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = alertType == "medical",
                                onClick = { alertType = "medical" },
                                label = { Text("🚑 Медицина", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = alertType == "fire",
                                onClick = { alertType = "fire" },
                                label = { Text("🔥 Пожар", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = alertType == "police",
                                onClick = { alertType = "police" },
                                label = { Text("👮 Полиция", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = alertType == "water_rescue",
                                onClick = { alertType = "water_rescue" },
                                label = { Text("🌊 На воде", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = alertType == "mountain_rescue",
                                onClick = { alertType = "mountain_rescue" },
                                label = { Text("⛰️ Горы", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = alertType == "search_rescue",
                                onClick = { alertType = "search_rescue" },
                                label = { Text("🔍 Поиск", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = alertType == "ecological",
                                onClick = { alertType = "ecological" },
                                label = { Text("☢️ Экология", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = alertType == "general",
                                onClick = { alertType = "general" },
                                label = { Text("⚠️ Общая", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                    
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Заголовок") },
                        placeholder = { Text("Краткое описание") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Описание") },
                        placeholder = { Text("Подробности о ситуации...") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        maxLines = 5
                    )
                }
            }
        )
    }
    
    // Success Animation
    if (showSuccessAnimation) {
        LaunchedEffect(Unit) {
            delay(2000)
            showSuccessAnimation = false
        }
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.7f)),
            contentAlignment = Alignment.Center
        ) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color.White
                )
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = SuccessGreen,
                        modifier = Modifier.size(64.dp)
                    )
                    Text(
                        "Вызов отправлен!",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Помощь уже в пути",
                        fontSize = 16.sp,
                        color = Gray600
                    )
                }
            }
        }
    }
}

@Composable
fun StatusItem(
    icon: ImageVector,
    label: String,
    value: String,
    iconTint: Color = Color.White
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = iconTint,
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = Color.White.copy(alpha = 0.9f)
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
    }
}

@Composable
fun QuickActionCard(
    icon: String,
    title: String,
    description: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = icon,
                fontSize = 40.sp
            )
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = description,
                fontSize = 11.sp,
                color = Gray600
            )
        }
    }
}

@Composable
fun EmergencyNumberRow(
    number: String,
    service: String,
    color: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Phone,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
            }
            
            Column {
                Text(
                    text = service,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Gray900
                )
                Text(
                    text = "Звонок бесплатный",
                    fontSize = 11.sp,
                    color = Gray500
                )
            }
        }
        
        Text(
            text = number,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}
