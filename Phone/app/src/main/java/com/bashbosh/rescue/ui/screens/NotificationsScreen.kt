package com.bashbosh.rescue.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.R
import com.bashbosh.rescue.domain.model.AlertNotification
import com.bashbosh.rescue.ui.viewmodel.NotificationsUiState
import com.bashbosh.rescue.ui.components.GlassCard
import com.bashbosh.rescue.ui.components.PrimaryGradientButton
import com.bashbosh.rescue.ui.components.RescueBackground
import com.bashbosh.rescue.ui.theme.PrimaryRose
import com.bashbosh.rescue.ui.theme.SecondaryIndigo

@Composable
fun NotificationsScreen(
    state: NotificationsUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onMarkAllRead: () -> Unit,
    onMarkRead: (String) -> Unit
) {
    RescueBackground(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            NotificationsHeader(onBack, onRefresh, onMarkAllRead)

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.TopCenter
            ) {
                when {
                    state.isLoading -> NotificationsLoadingView(modifier = Modifier.fillMaxSize())
                    state.error != null -> NotificationsErrorView(
                        message = state.error,
                        onRetry = onRefresh,
                        modifier = Modifier.fillMaxWidth()
                    )
                    state.notifications.isEmpty() -> EmptyNotificationsView(modifier = Modifier.fillMaxWidth())
                    else -> NotificationsList(
                        notifications = state.notifications,
                        onMarkRead = onMarkRead,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationsHeader(
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onMarkAllRead: () -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_back),
                        contentDescription = null,
                        tint = SecondaryIndigo
                    )
                }
                Text(
                    text = stringResource(id = R.string.notifications_title),
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                IconButton(onClick = onRefresh) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_refresh),
                        contentDescription = null,
                        tint = SecondaryIndigo
                    )
                }
            }
            PrimaryGradientButton(
                text = stringResource(id = R.string.notifications_mark_all),
                modifier = Modifier.fillMaxWidth(),
                onClick = onMarkAllRead
            )
        }
    }
}

@Composable
private fun NotificationsLoadingView(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(color = SecondaryIndigo)
    }
}

@Composable
private fun NotificationsErrorView(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(text = message, style = MaterialTheme.typography.bodyLarge)
            PrimaryGradientButton(
                text = stringResource(id = R.string.notifications_retry),
                modifier = Modifier.fillMaxWidth(),
                onClick = onRetry
            )
        }
    }
}

@Composable
private fun EmptyNotificationsView(modifier: Modifier = Modifier) {
    GlassCard(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = stringResource(id = R.string.notifications_empty),
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
private fun NotificationsList(
    notifications: List<AlertNotification>,
    onMarkRead: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        items(notifications) { notification ->
            NotificationCard(notification, onMarkRead)
        }
    }
}

@Composable
private fun NotificationCard(
    notification: AlertNotification,
    onMarkRead: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(text = notification.title, style = MaterialTheme.typography.titleMedium)
            Text(text = notification.message, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = notification.createdAt?.toString() ?: "",
                style = MaterialTheme.typography.labelMedium,
                color = PrimaryRose
            )
            if (!notification.isRead) {
                OutlinedButton(
                    onClick = { onMarkRead(notification.id) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = stringResource(id = R.string.notifications_mark_read))
                }
            }
        }
    }
}
