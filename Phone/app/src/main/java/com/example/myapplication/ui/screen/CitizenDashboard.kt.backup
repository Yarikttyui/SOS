package com.example.myapplication.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.model.User

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
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = user.full_name,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Гражданин",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Выход"
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = MaterialTheme.colorScheme.error
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Создать вызов",
                    tint = MaterialTheme.colorScheme.onError
                )
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(32.dp))
            
            // Emergency icon
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                modifier = Modifier.size(120.dp),
                tint = MaterialTheme.colorScheme.error
            )
            
            Text(
                text = "🚨 Экстренная помощь",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = "Нажмите кнопку ниже для создания экстренного вызова",
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Emergency types cards
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Типы экстренных ситуаций:",
                        fontWeight = FontWeight.Bold
                    )
                    
                    EmergencyTypeItem("🏥", "Медицинская помощь", "Травмы, болезни, несчастные случаи")
                    EmergencyTypeItem("🔥", "Пожар", "Возгорание, задымление")
                    EmergencyTypeItem("🚗", "ДТП", "Автомобильная авария")
                    EmergencyTypeItem("⚠️", "Другое", "Иные чрезвычайные ситуации")
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Create alert button
            Button(
                onClick = { showCreateDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Создать экстренный вызов", fontSize = 18.sp)
            }
        }
        
        // Create alert dialog
        if (showCreateDialog) {
            AlertDialog(
                onDismissRequest = { showCreateDialog = false },
                title = { Text("🚨 Создать вызов") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Type selection
                        Text("Тип ситуации:", fontWeight = FontWeight.Bold)
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = alertType == "medical",
                                onClick = { alertType = "medical" },
                                label = { Text("🏥 Медицина") }
                            )
                            FilterChip(
                                selected = alertType == "fire",
                                onClick = { alertType = "fire" },
                                label = { Text("🔥 Пожар") }
                            )
                        }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = alertType == "accident",
                                onClick = { alertType = "accident" },
                                label = { Text("🚗 ДТП") }
                            )
                            FilterChip(
                                selected = alertType == "other",
                                onClick = { alertType = "other" },
                                label = { Text("⚠️ Другое") }
                            )
                        }
                        
                        // Title
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Краткое описание") },
                            placeholder = { Text("Например: Человек упал") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        
                        // Description
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Подробности") },
                            placeholder = { Text("Опишите ситуацию подробнее") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            maxLines = 4
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (title.isNotBlank() && description.isNotBlank()) {
                                onCreateAlert(alertType, title, description)
                                showCreateDialog = false
                                title = ""
                                description = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Отправить")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showCreateDialog = false }) {
                        Text("Отмена")
                    }
                }
            )
        }
    }
}

@Composable
fun EmergencyTypeItem(icon: String, title: String, description: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = icon,
            fontSize = 32.sp
        )
        Column {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
            Text(
                text = description,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
