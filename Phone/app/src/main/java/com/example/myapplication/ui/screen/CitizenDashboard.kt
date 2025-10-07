package com.example.myapplication.ui.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.NotificationImportant
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.model.User
import com.example.myapplication.ui.theme.AuroraRose
import com.example.myapplication.ui.theme.AuroraRoseDark
import com.example.myapplication.ui.theme.AuroraViolet
import com.example.myapplication.ui.theme.AuroraVioletDark
import com.example.myapplication.ui.theme.CardSurfaceDark
import com.example.myapplication.ui.theme.GlassDark
import com.example.myapplication.ui.theme.GlassWhite
import com.example.myapplication.ui.theme.Gray100
import com.example.myapplication.ui.theme.Gray300
import com.example.myapplication.ui.theme.Gray600
import com.example.myapplication.ui.theme.Gray700
import com.example.myapplication.ui.theme.Gray900
import com.example.myapplication.ui.theme.LuminousAmber
import com.example.myapplication.ui.theme.NightBackground
import com.example.myapplication.ui.theme.SignalEmerald
import com.example.myapplication.ui.theme.SkyPulse
import com.example.myapplication.ui.theme.SkyPulseLight
import com.example.myapplication.ui.theme.Slate950
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CitizenDashboard(
    user: User,
    onCreateAlert: (String, String, String) -> Unit,
    onLogout: () -> Unit
) {
    var showCreateDialog by rememberSaveable { mutableStateOf(false) }
    var alertType by rememberSaveable { mutableStateOf("medical") }
    var title by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var showSuccess by remember { mutableStateOf(false) }

    LaunchedEffect(showSuccess) {
        if (showSuccess) {
            delay(2600)
            showSuccess = false
        }
    }

    val listState = rememberLazyListState()
    val quickActions = remember { buildQuickActions() }
    val selectedAction = quickActions.firstOrNull { it.code == alertType } ?: quickActions.first()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Slate950, NightBackground)))
    ) {
        AuroraBackdrop()

        Scaffold(
            containerColor = Color.Transparent
        ) { innerPadding ->
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 32.dp, bottom = 36.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                item {
                    CitizenHeroCard(
                        user = user,
                        onLogout = onLogout,
                        activeType = selectedAction
                    )
                }

                item {
                    SosControlCard(
                        actions = quickActions,
                        selectedAction = selectedAction,
                        onSelect = { alertType = it },
                        onTapSos = { showCreateDialog = true }
                    )
                }

                item {
                    QuickActionsSection(
                        actions = quickActions,
                        selectedType = alertType,
                        onSelect = {
                            alertType = it
                            showCreateDialog = true
                        }
                    )
                }

                item {
                    PreparednessCard()
                }

                item {
                    EmergencyNumbersCard()
                }
            }
        }

        AnimatedVisibility(
            visible = showSuccess,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 24.dp)
        ) {
            SuccessToast()
        }
    }

    if (showCreateDialog) {
        CreateAlertDialog(
            currentType = alertType,
            onTypeChange = { alertType = it },
            title = title,
            onTitleChange = { title = it },
            description = description,
            onDescriptionChange = { description = it },
            onDismiss = { showCreateDialog = false },
            onConfirm = {
                val finalTitle = if (title.isBlank()) defaultTitleForType(alertType) else title.trim()
                val finalDescription = description.trim()

                onCreateAlert(alertType, finalTitle, finalDescription)
                showCreateDialog = false
                showSuccess = true
                title = ""
                description = ""
            }
        )
    }
}

@Composable
private fun CitizenHeroCard(
    user: User,
    onLogout: () -> Unit,
    activeType: QuickAction
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(36.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp, pressedElevation = 0.dp)
    ) {
        Box(
            modifier = Modifier
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(AuroraRose, AuroraViolet)
                    )
                )
                .padding(24.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.18f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.9f),
                                modifier = Modifier.size(30.dp)
                            )
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = user.full_name,
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color.White
                            )
                            Text(
                                text = "Гражданин | ${activeType.title}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }

                    IconButton(
                        onClick = onLogout,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.16f))
                    ) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Выход",
                            tint = Color.White
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatusChip(
                        icon = Icons.Default.CheckCircle,
                        label = "Система активна",
                        background = Color.White.copy(alpha = 0.18f)
                    )
                    StatusChip(
                        icon = Icons.Default.LocationOn,
                        label = "GPS синхрон",
                        background = Color.White.copy(alpha = 0.18f)
                    )
                    StatusChip(
                        icon = Icons.Default.NotificationImportant,
                        label = "Оповещения",
                        background = Color.White.copy(alpha = 0.18f)
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusChip(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, background: Color) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(100))
            .background(background)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.9f),
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = Color.White
        )
    }
}

@Composable
private fun SosControlCard(
    actions: List<QuickAction>,
    selectedAction: QuickAction,
    onSelect: (String) -> Unit,
    onTapSos: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(36.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = GlassDark.copy(alpha = 0.82f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 18.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Text(
                text = "Экстренный вызов",
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White
            )
            Text(
                text = "Выберите тип происшествия и нажмите большую кнопку, чтобы мгновенно отправить сигнал",
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.72f),
                textAlign = TextAlign.Center
            )

            LargeSosButton(onClick = onTapSos)

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Вы выбрали: ${selectedAction.title}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    actions.take(3).forEach { action ->
                        EmergencyTypePill(
                            action = action,
                            selected = action.code == selectedAction.code,
                            onClick = { onSelect(action.code) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LargeSosButton(onClick: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "sosPulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "sosScale"
    )

    Box(
        modifier = Modifier
            .size(220.dp)
            .scale(scale),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(220.dp)
                .clip(CircleShape)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(AuroraRose.copy(alpha = 0.55f), Color.Transparent)
                    )
                )
        )

        Box(
            modifier = Modifier
                .size(190.dp)
                .clip(CircleShape)
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(AuroraRose, AuroraViolet, SkyPulse)
                    )
                )
                .border(1.5.dp, Color.White.copy(alpha = 0.35f), CircleShape)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "SOS",
                    style = MaterialTheme.typography.displayMedium,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    text = "НАЖМИТЕ",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.95f),
                    letterSpacing = 2.sp
                )
            }
        }
    }
}

@Composable
private fun EmergencyTypePill(action: QuickAction, selected: Boolean, onClick: () -> Unit) {
    var modifier = Modifier.clip(RoundedCornerShape(100))
    modifier = if (selected) {
        modifier.background(Brush.linearGradient(action.gradient))
    } else {
        modifier.background(Color.White.copy(alpha = 0.06f))
    }
    modifier = modifier
        .border(
            width = 1.dp,
            color = if (selected) Color.White.copy(alpha = 0.45f) else Color.White.copy(alpha = 0.18f),
            shape = RoundedCornerShape(100)
        )
        .clickable(onClick = onClick)
        .padding(horizontal = 18.dp, vertical = 12.dp)

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(text = action.emoji, fontSize = 18.sp)
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = action.title,
                style = MaterialTheme.typography.bodyMedium,
                color = if (selected) Color.White else Color.White.copy(alpha = 0.85f)
            )
            Text(
                text = action.description,
                style = MaterialTheme.typography.labelSmall,
                color = if (selected) Color.White.copy(alpha = 0.92f) else Color.White.copy(alpha = 0.6f)
            )
        }
    }
}

@Composable
private fun QuickActionsSection(
    actions: List<QuickAction>,
    selectedType: String,
    onSelect: (String) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Выберите ситуацию",
            style = MaterialTheme.typography.titleLarge,
            color = Color.White
        )
        Text(
            text = "AI ассистент поможет уточнить детали и приоритет",
            style = MaterialTheme.typography.bodySmall,
            color = Color.White.copy(alpha = 0.68f)
        )

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(actions) { action ->
                QuickActionCard(
                    action = action,
                    selected = action.code == selectedType,
                    onSelect = { onSelect(action.code) }
                )
            }
        }
    }
}

@Composable
private fun QuickActionCard(action: QuickAction, selected: Boolean, onSelect: () -> Unit) {
    val borderColor = if (selected) Color.White.copy(alpha = 0.55f) else Color.White.copy(alpha = 0.18f)
    Box(
        modifier = Modifier
            .width(220.dp)
            .height(140.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(Brush.linearGradient(action.gradient))
            .border(1.dp, borderColor, RoundedCornerShape(28.dp))
            .clickable(onClick = onSelect)
            .padding(18.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.Start
        ) {
            Text(text = action.emoji, fontSize = 28.sp)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = action.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.White
                )
                Text(
                    text = action.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.85f)
                )
            }
        }
    }
}

@Composable
private fun PreparednessCard() {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = GlassWhite.copy(alpha = 0.92f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 14.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Как подготовиться",
                style = MaterialTheme.typography.titleLarge,
                color = Gray900
            )
            Text(
                text = "Сохраняйте спокойствие, говорите чётко и следуйте инструкциям AI ассистента.",
                style = MaterialTheme.typography.bodyMedium,
                color = Gray600
            )
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                PreparednessItem("📍 Уточните адрес или ориентиры, чтобы бригада быстрее вас нашла")
                PreparednessItem("🧍‍♂️ Сообщите о числе пострадавших и их состоянии")
                PreparednessItem("⚠️ Укажите опасности: газ, огонь, замкнутые пространства")
            }
        }
    }
}

@Composable
private fun PreparednessItem(text: String) {
    Text(
        text = "• $text",
        style = MaterialTheme.typography.bodySmall,
        color = Gray600,
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun EmergencyNumbersCard() {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = CardSurfaceDark.copy(alpha = 0.92f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Text(
                text = "Телефоны экстренных служб",
                style = MaterialTheme.typography.titleLarge,
                color = Color.White
            )
            EmergencyNumberRow("101", "Пожарная охрана", AuroraRose)
            EmergencyNumberRow("102", "Полиция", AuroraViolet)
            EmergencyNumberRow("103", "Скорая помощь", SkyPulse)
            EmergencyNumberRow("112", "Единый номер", LuminousAmber)
        }
    }
}

@Composable
private fun EmergencyNumberRow(number: String, label: String, accent: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.78f)
            )
            Text(
                text = number,
                style = MaterialTheme.typography.headlineMedium,
                color = accent,
                fontWeight = FontWeight.ExtraBold
            )
        }
        Text(
            text = "Кнопка вызова",
            style = MaterialTheme.typography.labelSmall,
            color = Gray300,
            modifier = Modifier
                .clip(RoundedCornerShape(100))
                .background(Color.White.copy(alpha = 0.08f))
                .padding(horizontal = 14.dp, vertical = 8.dp)
        )
    }
}

@Composable
private fun SuccessToast() {
    Surface(
        shape = RoundedCornerShape(32.dp),
        color = GlassWhite,
        tonalElevation = 12.dp
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = SignalEmerald
            )
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "SOS сигнал отправлен",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray900
                )
                Text(
                    text = "Оператор уже направляет помощь",
                    style = MaterialTheme.typography.bodySmall,
                    color = Gray600
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateAlertDialog(
    currentType: String,
    onTypeChange: (String) -> Unit,
    title: String,
    onTitleChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val typeOptions = remember { buildQuickActions() }
    val confirmEnabled = description.trim().length >= 10

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = confirmEnabled,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AuroraRose,
                    disabledContainerColor = AuroraRose.copy(alpha = 0.4f)
                )
            ) {
                Text("Отправить SOS")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Отмена")
            }
        },
        title = {
            Text(
                text = "Опишите происшествие",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Тип ситуации",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Gray700
                    )
                    FlowChipGroup(
                        options = typeOptions,
                        selected = currentType,
                        onSelect = onTypeChange
                    )
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = onTitleChange,
                    label = { Text("Заголовок") },
                    placeholder = { Text("Кратко: например, ДТП на трассе") },
                    singleLine = true,
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = AuroraRose,
                        cursorColor = AuroraRose
                    )
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = onDescriptionChange,
                    label = { Text("Что происходит?") },
                    placeholder = { Text("Подробно опишите опасность, пострадавших и адрес") },
                    minLines = 5,
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = AuroraRose,
                        cursorColor = AuroraRose
                    )
                )

                Text(
                    text = if (confirmEnabled) "Спасибо, диспетчеры готовы принять вызов" else "Добавьте минимум 10 символов, чтобы мы точно поняли ситуацию",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (confirmEnabled) SignalEmerald else AuroraRose
                )
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun FlowChipGroup(
    options: List<QuickAction>,
    selected: String,
    onSelect: (String) -> Unit
) {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        maxItemsInEachRow = 3
    ) {
        options.forEach { action ->
            val isSelected = action.code == selected
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        if (isSelected) Brush.linearGradient(action.gradient)
                        else Brush.linearGradient(listOf(Gray100, Gray100))
                    )
                    .border(
                        width = 1.dp,
                        color = if (isSelected) Color.Transparent else Gray300,
                        shape = RoundedCornerShape(18.dp)
                    )
                    .clickable { onSelect(action.code) }
                    .padding(horizontal = 12.dp, vertical = 12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = action.emoji + " " + action.title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isSelected) Color.White else Gray700
                    )
                    Text(
                        text = action.description,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) Color.White.copy(alpha = 0.85f) else Gray600
                    )
                }
            }
        }
    }
}

@Composable
private fun AuroraBackdrop() {
    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .size(420.dp)
                .offset(x = (-160).dp, y = (-120).dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AuroraViolet.copy(alpha = 0.48f), Color.Transparent)
                    )
                )
        )
        Box(
            modifier = Modifier
                .size(360.dp)
                .offset(x = (220).dp, y = (-80).dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(SkyPulse.copy(alpha = 0.35f), Color.Transparent)
                    )
                )
        )
        Box(
            modifier = Modifier
                .size(420.dp)
                .offset(x = (-120).dp, y = (420).dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AuroraRose.copy(alpha = 0.32f), Color.Transparent)
                    )
                )
        )
    }
}

private data class QuickAction(
    val code: String,
    val emoji: String,
    val title: String,
    val description: String,
    val gradient: List<Color>
)

private fun buildQuickActions(): List<QuickAction> = listOf(
    QuickAction(
        code = "medical",
        emoji = "🚑",
        title = "Медицина",
        description = "Помощь медика",
        gradient = listOf(SkyPulse, AuroraViolet)
    ),
    QuickAction(
        code = "fire",
        emoji = "🔥",
        title = "Пожар",
        description = "Огонь и дым",
        gradient = listOf(AuroraRose, AuroraRoseDark)
    ),
    QuickAction(
        code = "police",
        emoji = "👮",
        title = "Полиция",
        description = "Угроза безопасности",
        gradient = listOf(AuroraVioletDark, Gray700)
    ),
    QuickAction(
        code = "water_rescue",
        emoji = "🌊",
        title = "Спасение на воде",
        description = "Течение, наводнение",
        gradient = listOf(SkyPulse, Color(0xFF0EA5E9))
    ),
    QuickAction(
        code = "mountain_rescue",
        emoji = "🧗",
        title = "Горы",
        description = "Срыв, лавина",
        gradient = listOf(Color(0xFF6366F1), Color(0xFF4338CA))
    ),
    QuickAction(
        code = "search_rescue",
        emoji = "🔍",
        title = "Поиск",
        description = "Пропавшие люди",
        gradient = listOf(Color(0xFF0EA5E9), Color(0xFF14B8A6))
    ),
    QuickAction(
        code = "ecological",
        emoji = "☢️",
        title = "Экология",
        description = "Химическая опасность",
        gradient = listOf(Color(0xFF22C55E), Color(0xFF16A34A))
    ),
    QuickAction(
        code = "general",
        emoji = "⚠️",
        title = "Другое",
        description = "Необходима помощь",
        gradient = listOf(Color(0xFF475569), Color(0xFF1F2937))
    )
)

private fun defaultTitleForType(type: String): String = when (type) {
    "medical" -> "Нужна медицинская помощь"
    "fire" -> "Обнаружен пожар"
    "police" -> "Нужна полиция"
    "water_rescue" -> "Спасение на воде"
    "mountain_rescue" -> "Помощь в горах"
    "search_rescue" -> "Поисковая операция"
    "ecological" -> "Экологическая тревога"
    else -> "Экстренная ситуация"
}
