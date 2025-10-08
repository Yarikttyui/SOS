package com.bashbosh.rescue.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.R
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.domain.model.AlertStatus
import com.bashbosh.rescue.domain.model.UserRole
import com.bashbosh.rescue.domain.model.UserSession
import com.bashbosh.rescue.ui.screens.components.CompleteAlertDialog
import com.bashbosh.rescue.ui.viewmodel.DashboardUiState

@Composable
fun DashboardScreen(
    state: DashboardUiState,
    session: UserSession,
    onSelectAlert: (String) -> Unit,
    onRefresh: (AlertStatus?) -> Unit,
    onLogout: () -> Unit,
    onAcceptAlert: (String) -> Unit,
    onCompleteAlert: (String, String?) -> Unit,
    onOpenNotifications: () -> Unit
) {
    Surface(color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize()) {
            DashboardHeader(session, onLogout, onOpenNotifications)
            AlertFilters(onFilterSelected = onRefresh)
            when {
                state.isLoading -> LoadingView()
                state.error != null -> ErrorView(state.error, onRefresh)
                state.alerts.isEmpty() -> EmptyView()
                else -> AlertsList(
                    alerts = state.alerts,
                    session = session,
                    onSelectAlert = onSelectAlert,
                    onAcceptAlert = onAcceptAlert,
                    onCompleteAlert = onCompleteAlert
                )
            }
        }
    }
}

@Composable
private fun DashboardHeader(
    session: UserSession,
    onLogout: () -> Unit,
    onOpenNotifications: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0A2146))
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column {
                Text(
                    text = stringResource(id = R.string.dashboard_title),
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White
                )
                Text(
                    text = session.user?.fullName ?: session.user?.email ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.7f)
                )
            }
            Icon(
                imageVector = Icons.Outlined.Notifications,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier
                    .clickable(onClick = onOpenNotifications)
                    .padding(8.dp)
            )
        }
        TextButton(onClick = onLogout) {
            Text(text = stringResource(id = R.string.dashboard_logout), color = Color.White)
        }
    }
}

@Composable
private fun AlertFilters(onFilterSelected: (AlertStatus?) -> Unit) {
    val filters = listOf(null, AlertStatus.PENDING, AlertStatus.ASSIGNED, AlertStatus.IN_PROGRESS)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        filters.forEach { status ->
            AssistChip(
                onClick = { onFilterSelected(status) },
                label = { Text(text = status?.raw?.uppercase() ?: stringResource(id = R.string.dashboard_filter_all)) }
            )
        }
    }
}

@Composable
private fun LoadingView() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorView(message: String, onRetry: (AlertStatus?) -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = message, style = MaterialTheme.typography.bodyLarge)
            Button(onClick = { onRetry(null) }, modifier = Modifier.padding(top = 8.dp)) {
                Text(text = stringResource(id = R.string.dashboard_retry))
            }
        }
    }
}

@Composable
private fun EmptyView() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = stringResource(id = R.string.dashboard_empty))
    }
}

@Composable
private fun AlertsList(
    alerts: List<Alert>,
    session: UserSession,
    onSelectAlert: (String) -> Unit,
    onAcceptAlert: (String) -> Unit,
    onCompleteAlert: (String, String?) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(alerts) { alert ->
            AlertCard(
                alert = alert,
                isRescuer = session.user?.role == UserRole.RESCUER,
                onSelect = { onSelectAlert(alert.id) },
                onAccept = { onAcceptAlert(alert.id) },
                onComplete = { report -> onCompleteAlert(alert.id, report) }
            )
            Divider()
        }
    }
}

@Composable
private fun AlertCard(
    alert: Alert,
    isRescuer: Boolean,
    onSelect: () -> Unit,
    onAccept: () -> Unit,
    onComplete: (String?) -> Unit
) {
    var showCompleteDialog by remember { mutableStateOf(false) }

    if (showCompleteDialog) {
        CompleteAlertDialog(
            onDismiss = { showCompleteDialog = false },
            onConfirm = {
                onComplete(it)
                showCompleteDialog = false
            }
    )
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp)
            .clickable(onClick = onSelect),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = alert.title ?: stringResource(id = R.string.alert_card_title_fallback, alert.type.raw.uppercase()),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = alert.description ?: stringResource(id = R.string.alert_card_description_fallback))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = stringResource(id = R.string.alert_card_status, alert.status.raw.uppercase()))
            alert.address?.let {
                Text(text = stringResource(id = R.string.alert_card_address, it))
            }
            alert.formattedCreatedAt?.let {
                Text(text = stringResource(id = R.string.alert_card_time, it))
            }

            if (isRescuer) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (alert.isAvailable) {
                        Button(onClick = onAccept, modifier = Modifier.weight(1f)) {
                            Text(text = stringResource(id = R.string.alert_card_accept))
                        }
                    }
                    if (alert.isInProgress) {
                        Button(onClick = { showCompleteDialog = true }, modifier = Modifier.weight(1f)) {
                            Text(text = stringResource(id = R.string.alert_card_complete))
                        }
                    }
                }
            }
        }
    }
}
