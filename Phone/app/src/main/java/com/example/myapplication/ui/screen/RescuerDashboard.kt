package com.example.myapplication.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.model.SOSAlert
import com.example.myapplication.data.model.User
import com.example.myapplication.ui.theme.AuroraRose
import com.example.myapplication.ui.theme.AuroraRoseDark
import com.example.myapplication.ui.theme.AuroraViolet
import com.example.myapplication.ui.theme.GlassDark
import com.example.myapplication.ui.theme.LuminousAmber
import com.example.myapplication.ui.theme.NightBackground
import com.example.myapplication.ui.theme.SignalEmerald
import com.example.myapplication.ui.theme.SkyPulse
import com.example.myapplication.ui.theme.SkyPulseLight
import com.example.myapplication.ui.theme.Slate950
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private enum class RescuerTab { My, Team, Available }

private data class QuickStat(
    val label: String,
    val value: Int,
    val gradient: List<Color>
)

private data class StatusBadgeData(
    val label: String,
    val textColor: Color,
    val background: Color
)

private val CompletedStatuses = setOf("completed", "cancelled")

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
    var activeTab by rememberSaveable { mutableStateOf(RescuerTab.My) }
    var showTestDialog by remember { mutableStateOf(false) }
    var lastUpdateMillis by remember { mutableStateOf(System.currentTimeMillis()) }
    var manualRefreshing by remember { mutableStateOf(false) }

    val refreshCallback by rememberUpdatedState(onRefresh)

    LaunchedEffect(Unit) {
        while (isActive) {
            delay(15000)
            refreshCallback()
            lastUpdateMillis = System.currentTimeMillis()
        }
    }

    val myAlerts by remember(alerts, user.id) {
        derivedStateOf {
            alerts.filter { alert ->
                alert.assigned_to == user.id && alert.status !in CompletedStatuses
            }
        }
    }

    val teamAlerts by remember(alerts, user.team_id) {
        derivedStateOf {
            if (user.team_id == null) emptyList() else alerts.filter { alert ->
                alert.team_id == user.team_id && alert.status !in CompletedStatuses
            }
        }
    }

    val availableAlerts by remember(alerts, user.team_id) {
        derivedStateOf {
            alerts.filter { alert ->
                alert.status == "assigned" &&
                    (alert.team_id == null || alert.team_id == user.team_id) &&
                    alert.assigned_to == null
            }
        }
    }

    val filteredAlerts by remember(activeTab, myAlerts, teamAlerts, availableAlerts) {
        derivedStateOf {
            when (activeTab) {
                RescuerTab.My -> myAlerts
                RescuerTab.Team -> teamAlerts
                RescuerTab.Available -> availableAlerts
            }
        }
    }

    val stats = remember(myAlerts.size, teamAlerts.size, availableAlerts.size, user.team_id, user.is_team_leader) {
        buildList {
            add(QuickStat("Мои вызовы", myAlerts.size, listOf(SkyPulse, AuroraViolet)))
            if (user.team_id != null) {
                add(QuickStat("Команда", teamAlerts.size, listOf(AuroraViolet, AuroraRose)))
            }
            if (user.is_team_leader) {
                add(QuickStat("Доступные", availableAlerts.size, listOf(LuminousAmber, AuroraRoseDark)))
            }
        }
    }

    val backgroundBrush = Brush.verticalGradient(listOf(Slate950, NightBackground))

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
    ) {
        RescuerAuroraBackdrop()

        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                RescuerTopBar(
                    userName = user.full_name ?: user.email,
                    lastUpdateMillis = lastUpdateMillis,
                    isRefreshing = manualRefreshing,
                    onRefreshClick = {
                        manualRefreshing = true
                        onRefresh()
                        lastUpdateMillis = System.currentTimeMillis()
                        manualRefreshing = false
                    },
                    onTestSiren = { showTestDialog = true },
                    onLogout = onLogout
                )
            }
        ) { innerPadding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                item {
                    RescuerHeroCard(
                        user = user,
                        myCount = myAlerts.size,
                        teamCount = teamAlerts.size,
                        availableCount = availableAlerts.size,
                        lastUpdated = lastUpdateMillis,
                        onTestSiren = { showTestDialog = true }
                    )
                }

                if (stats.isNotEmpty()) {
                    item {
                        MetricsRow(stats = stats)
                    }
                }

                item {
                    RescuerSegmentedControl(
                        activeTab = activeTab,
                        canShowTeam = user.team_id != null,
                        canShowAvailable = user.is_team_leader,
                        onTabSelected = { activeTab = it }
                    )
                }

                if (filteredAlerts.isEmpty()) {
                    item {
                        EmptyStateCard(activeTab = activeTab)
                    }
                } else {
                    items(filteredAlerts, key = { it.id }) { alert ->
                        RescuerAlertCard(
                            alert = alert,
                            canAccept = activeTab == RescuerTab.Available && user.is_team_leader,
                            canComplete = (activeTab == RescuerTab.My || activeTab == RescuerTab.Team) && alert.status == "in_progress" && user.is_team_leader,
                            onAccept = { onAcceptAlert(alert.id) },
                            onComplete = { onCompleteAlert(alert.id) }
                        )
                    }
                }
            }
        }

        if (showTestDialog) {
            TestSirenDialog(
                onDismiss = { showTestDialog = false },
                onConfirm = {
                    onTestSiren()
                    showTestDialog = false
                }
            )
        }
    }
}

@Composable
private fun RescuerTopBar(
    userName: String,
    lastUpdateMillis: Long,
    isRefreshing: Boolean,
    onRefreshClick: () -> Unit,
    onTestSiren: () -> Unit,
    onLogout: () -> Unit
) {
    Surface(
        color = Color.Transparent,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Панель спасателя",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
                Text(
                    text = "$userName • обновлено ${formatUpdateTime(lastUpdateMillis)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.65f)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                IconButton(onClick = onRefreshClick) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Обновить",
                        tint = if (isRefreshing) SkyPulseLight else Color.White.copy(alpha = 0.8f)
                    )
                }
                IconButton(onClick = onTestSiren) {
                    Icon(
                        imageVector = Icons.Default.VolumeUp,
                        contentDescription = "Тест сирены",
                        tint = AuroraRose
                    )
                }
                IconButton(onClick = onLogout) {
                    Icon(
                        imageVector = Icons.Default.Logout,
                        contentDescription = "Выход",
                        tint = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun RescuerHeroCard(
    user: User,
    myCount: Int,
    teamCount: Int,
    availableCount: Int,
    lastUpdated: Long,
    onTestSiren: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(36.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = GlassDark.copy(alpha = 0.88f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = user.full_name ?: user.email,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White
                    )
                    Text(
                        text = buildString {
                            append("Роль: спасатель")
                            if (user.is_team_leader) append(" • Лидер команды")
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                }
                Surface(
                    onClick = onTestSiren,
                    shape = RoundedCornerShape(28.dp),
                    color = Color.Transparent,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.25f))
                ) {
                    Text(
                        text = "Тест сирены",
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            }

            if (user.team_name != null) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color.White.copy(alpha = 0.1f))
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Group,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.9f)
                    )
                    Text(
                        text = user.team_name,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White
                    )
                    if (user.is_team_leader) {
                        Surface(
                            color = AuroraRose.copy(alpha = 0.25f),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                text = "Лидер",
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                HeroStatPill(label = "Мои", value = myCount)
                if (user.team_id != null) {
                    HeroStatPill(label = "Команда", value = teamCount)
                }
                if (user.is_team_leader) {
                    HeroStatPill(label = "Доступно", value = availableCount, accent = LuminousAmber)
                }
            }

            Text(
                text = "Готовы к немедленному реагированию • ${formatUpdateTime(lastUpdated)}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.65f)
            )
        }
    }
}

@Composable
private fun HeroStatPill(label: String, value: Int, accent: Color = SkyPulse) {
    Column(
        modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(28.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(28.dp))
            .padding(vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = value.toString(),
            style = MaterialTheme.typography.headlineSmall,
            color = accent,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = Color.White.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun MetricsRow(stats: List<QuickStat>) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        stats.forEach { stat ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.linearGradient(stat.gradient))
                    .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(24.dp))
                    .padding(vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = stat.value.toString(),
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = stat.label,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }
            }
        }
    }
}

@Composable
private fun RescuerSegmentedControl(
    activeTab: RescuerTab,
    canShowTeam: Boolean,
    canShowAvailable: Boolean,
    onTabSelected: (RescuerTab) -> Unit
) {
    val tabs = remember(canShowTeam, canShowAvailable) {
        buildList {
            add(RescuerTab.My)
            if (canShowTeam) add(RescuerTab.Team)
            if (canShowAvailable) add(RescuerTab.Available)
        }
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = GlassDark.copy(alpha = 0.7f),
        shape = RoundedCornerShape(28.dp),
        tonalElevation = 8.dp
    ) {
        Row(
            modifier = Modifier.padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            tabs.forEach { tab ->
                SegmentedButton(
                    text = when (tab) {
                        RescuerTab.My -> "Мои"
                        RescuerTab.Team -> "Команда"
                        RescuerTab.Available -> "Доступные"
                    },
                    selected = tab == activeTab,
                    onClick = { onTabSelected(tab) }
                )
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun SegmentedButton(text: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(24.dp),
        color = if (selected) Color.Transparent else Color.Transparent,
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = if (selected) Color.Transparent else Color.White.copy(alpha = 0.12f)
        )
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(24.dp))
                .background(
                    if (selected) Brush.linearGradient(listOf(AuroraRose, AuroraViolet)) else Color.Transparent
                )
                .padding(horizontal = 18.dp, vertical = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = text,
                style = MaterialTheme.typography.bodyMedium,
                color = if (selected) Color.White else Color.White.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun RescuerAlertCard(
    alert: SOSAlert,
    canAccept: Boolean,
    canComplete: Boolean,
    onAccept: () -> Unit,
    onComplete: () -> Unit
) {
    val statusAppearance = remember(alert.status) { statusAppearance(alert.status) }
    val priorityLabel = remember(alert.priority) { priorityLabel(alert.priority) }
    val typeLabel = remember(alert.type) { typeLabel(alert.type) }
    val createdLabel = remember(alert.created_at) { formatTimestamp(alert.created_at) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(GlassDark.copy(alpha = 0.82f))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(28.dp))
            .padding(22.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = alert.title ?: typeLabel,
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White
                    )
                    if (createdLabel != null) {
                        Text(
                            text = "Создано: $createdLabel",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.6f)
                        )
                    }
                }
                StatusChip(data = statusAppearance)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoChip(text = typeLabel)
                if (priorityLabel != null) {
                    InfoChip(text = priorityLabel, accent = AuroraRose)
                }
                InfoChip(text = "ID ${alert.id.takeLast(6)}", accent = SkyPulseLight.copy(alpha = 0.6f))
            }

            if (!alert.description.isNullOrBlank()) {
                Text(
                    text = alert.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.82f)
                )
            }

            if (!alert.address.isNullOrBlank()) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = SkyPulseLight,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = alert.address,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.72f)
                    )
                }
            }

            if (alert.team_name != null || alert.assigned_to_name != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    alert.team_name?.let { InfoChip(text = it, accent = SkyPulse) }
                    alert.assigned_to_name?.let { InfoChip(text = it, accent = SignalEmerald) }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (canAccept) {
                    GradientActionButton(
                        text = "Принять вызов",
                        gradient = listOf(SkyPulse, AuroraViolet),
                        onClick = onAccept,
                        leadingIcon = Icons.Default.CheckCircle
                    )
                }
                if (canComplete) {
                    GradientActionButton(
                        text = "Завершить",
                        gradient = listOf(SignalEmerald, Color(0xFF16A34A)),
                        onClick = onComplete,
                        leadingIcon = Icons.Default.Check
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusChip(data: StatusBadgeData) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = data.background
    ) {
        Text(
            text = data.label,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
            color = data.textColor,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun InfoChip(text: String, accent: Color = Color.White.copy(alpha = 0.18f)) {
    Surface(
        color = accent.copy(alpha = 0.18f),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.25f))
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelSmall,
            color = Color.White.copy(alpha = 0.85f)
        )
    }
}

@Composable
private fun GradientActionButton(
    text: String,
    gradient: List<Color>,
    onClick: () -> Unit,
    leadingIcon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = RoundedCornerShape(18.dp),
        contentPadding = PaddingValues()
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.linearGradient(gradient))
                .clip(RoundedCornerShape(18.dp))
                .border(1.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(18.dp))
                .padding(horizontal = 18.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(leadingIcon, contentDescription = null, tint = Color.White)
                Text(text = text, color = Color.White, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun EmptyStateCard(activeTab: RescuerTab) {
    val message = when (activeTab) {
        RescuerTab.My -> "У вас нет активных вызовов. Ожидайте новых обращений."
        RescuerTab.Team -> "Команда в ожидании новых задач."
        RescuerTab.Available -> "Нет свободных вызовов. Проверьте позже."
    }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(GlassDark.copy(alpha = 0.7f))
            .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(28.dp))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White.copy(alpha = 0.75f),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun TestSirenDialog(onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Тест громкой сирены",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Сирена прозвучит на максимальной громкости в течение 30 секунд.",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Убедитесь, что рядом нет чувствительных к звуку людей.",
                    style = MaterialTheme.typography.bodySmall,
                    color = AuroraRose
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = AuroraRose)
            ) {
                Text("Запустить сирену")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Отмена")
            }
        }
    )
}

@Composable
private fun RescuerAuroraBackdrop() {
    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .size(420.dp)
                .offset(x = (-140).dp, y = (-120).dp)
                .clip(CircleShape)
                .background(Brush.radialGradient(listOf(AuroraViolet.copy(alpha = 0.45f), Color.Transparent)))
        )
        Box(
            modifier = Modifier
                .size(360.dp)
                .offset(x = 220.dp, y = (-60).dp)
                .clip(CircleShape)
                .background(Brush.radialGradient(listOf(SkyPulse.copy(alpha = 0.35f), Color.Transparent)))
        )
        Box(
            modifier = Modifier
                .size(400.dp)
                .offset(x = (-100).dp, y = 420.dp)
                .clip(CircleShape)
                .background(Brush.radialGradient(listOf(AuroraRose.copy(alpha = 0.32f), Color.Transparent)))
        )
    }
}

private fun statusAppearance(status: String): StatusBadgeData = when (status) {
    "pending" -> StatusBadgeData("Ожидание", LuminousAmber, LuminousAmber.copy(alpha = 0.18f))
    "assigned" -> StatusBadgeData("Назначен", SkyPulseLight, SkyPulseLight.copy(alpha = 0.18f))
    "in_progress" -> StatusBadgeData("В работе", Color.White, AuroraViolet.copy(alpha = 0.22f))
    "completed" -> StatusBadgeData("Завершен", SignalEmerald, SignalEmerald.copy(alpha = 0.18f))
    "cancelled" -> StatusBadgeData("Отменён", AuroraRose, AuroraRose.copy(alpha = 0.18f))
    else -> StatusBadgeData(status, Color.White.copy(alpha = 0.85f), Color.White.copy(alpha = 0.12f))
}

private fun typeLabel(type: String): String = when (type) {
    "medical" -> "Медицина"
    "fire" -> "Пожар"
    "police" -> "Полиция"
    "water_rescue" -> "На воде"
    "mountain_rescue" -> "Горы"
    "search_rescue" -> "Поиск"
    "ecological" -> "Экология"
    else -> "Общий вызов"
}

private fun priorityLabel(priority: String?): String? {
    val value = priority?.toIntOrNull() ?: return null
    val name = when (value) {
        1 -> "Приоритет 1 (критический)"
        2 -> "Приоритет 2 (высокий)"
        3 -> "Приоритет 3 (средний)"
        4 -> "Приоритет 4 (низкий)"
        5 -> "Приоритет 5 (инфо)"
        else -> null
    }
    return name
}

private fun formatTimestamp(value: String?): String? {
    if (value.isNullOrBlank()) return null
    return value.replace("T", " ").take(16)
}

private fun formatUpdateTime(millis: Long): String {
    val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    return formatter.format(Date(millis))
}
