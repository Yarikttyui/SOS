package com.bashbosh.rescue.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.bashbosh.rescue.ui.components.GlassCard
import com.bashbosh.rescue.ui.components.PrimaryGradientButton
import com.bashbosh.rescue.ui.components.RescueBackground
import com.bashbosh.rescue.ui.theme.PrimaryRose
import com.bashbosh.rescue.ui.theme.SecondaryIndigo

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
    RescueBackground(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            DashboardHeader(
                session = session,
                onLogout = onLogout,
                onOpenNotifications = onOpenNotifications
            )
            AlertFilters(onFilterSelected = onRefresh)

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.TopCenter
            ) {
                when {
                    state.isLoading -> LoadingView(modifier = Modifier.fillMaxSize())
                    state.error != null -> ErrorView(
                        message = state.error,
                        onRetry = onRefresh,
                        modifier = Modifier.fillMaxWidth()
                    )
                    state.alerts.isEmpty() -> EmptyView(modifier = Modifier.fillMaxWidth())
                    else -> AlertsList(
                        alerts = state.alerts,
                        session = session,
                        onSelectAlert = onSelectAlert,
                        onAcceptAlert = onAcceptAlert,
                        onCompleteAlert = onCompleteAlert,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

@Composable
private fun DashboardHeader(
    session: UserSession,
    onLogout: () -> Unit,
    onOpenNotifications: () -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = stringResource(id = R.string.dashboard_title),
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = session.user?.fullName ?: session.user?.email ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Icon(
                    imageVector = Icons.Outlined.Notifications,
                    contentDescription = null,
                    tint = SecondaryIndigo,
                    modifier = Modifier
                        .clickable(onClick = onOpenNotifications)
                        .padding(8.dp)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            TextButton(
                onClick = onLogout,
                modifier = Modifier.align(Alignment.End)
            ) {
                Text(
                    text = stringResource(id = R.string.dashboard_logout),
                    color = PrimaryRose
                )
            }
        }
    }
}

@Composable
private fun AlertFilters(
    modifier: Modifier = Modifier,
    onFilterSelected: (AlertStatus?) -> Unit
) {
    val filters = listOf(null, AlertStatus.PENDING, AlertStatus.ASSIGNED, AlertStatus.IN_PROGRESS)
    GlassCard(
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            filters.forEach { status ->
                AssistChip(
                    onClick = { onFilterSelected(status) },
                    label = {
                        Text(
                            text = status?.raw?.uppercase()
                                ?: stringResource(id = R.string.dashboard_filter_all)
                        )
                    }
                )
            }
        }
    }
}

@Composable
private fun LoadingView(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = SecondaryIndigo)
    }
}

@Composable
private fun ErrorView(
    message: String,
    onRetry: (AlertStatus?) -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(text = message, style = MaterialTheme.typography.bodyLarge)
            PrimaryGradientButton(
                text = stringResource(id = R.string.dashboard_retry),
                modifier = Modifier.fillMaxWidth(),
                onClick = { onRetry(null) }
            )
        }
    }
}

@Composable
private fun EmptyView(modifier: Modifier = Modifier) {
    GlassCard(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(text = stringResource(id = R.string.dashboard_empty), style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@Composable
private fun AlertsList(
    alerts: List<Alert>,
    session: UserSession,
    onSelectAlert: (String) -> Unit,
    onAcceptAlert: (String) -> Unit,
    onCompleteAlert: (String, String?) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(alerts) { alert ->
            AlertCard(
                alert = alert,
                isRescuer = session.user?.role == UserRole.RESCUER,
                onSelect = { onSelectAlert(alert.id) },
                onAccept = { onAcceptAlert(alert.id) },
                onComplete = { report -> onCompleteAlert(alert.id, report) }
            )
        }
    }
}

@Composable
private fun AlertCard(
    alert: Alert,
    isRescuer: Boolean,
    onSelect: () -> Unit,
    onAccept: () -> Unit,
    onComplete: (String?) -> Unit,
    modifier: Modifier = Modifier
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

    GlassCard(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onSelect)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = alert.title ?: stringResource(id = R.string.alert_card_title_fallback, alert.type.raw.uppercase()),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = alert.description ?: stringResource(id = R.string.alert_card_description_fallback))
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(id = R.string.alert_card_status, alert.status.raw.uppercase()),
                color = SecondaryIndigo,
                style = MaterialTheme.typography.labelLarge
            )
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
                        PrimaryGradientButton(
                            text = stringResource(id = R.string.alert_card_accept),
                            modifier = Modifier.weight(1f),
                            onClick = onAccept
                        )
                    }
                    if (alert.isInProgress) {
                        OutlinedButton(
                            onClick = { showCompleteDialog = true },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(text = stringResource(id = R.string.alert_card_complete))
                        }
                    }
                }
            }
        }
    }
}
