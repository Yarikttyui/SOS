package com.bashbosh.rescue.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.R
import com.bashbosh.rescue.domain.model.AlertNotification
import com.bashbosh.rescue.ui.viewmodel.NotificationsUiState

@Composable
fun NotificationsScreen(
    state: NotificationsUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onMarkAllRead: () -> Unit,
    onMarkRead: (String) -> Unit
) {
    Surface(color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize()) {
            TopAppBar(
                title = { Text(text = stringResource(id = R.string.notifications_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_back),
                            contentDescription = null
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_refresh),
                            contentDescription = null
                        )
                    }
                }
            )

            when {
                state.isLoading -> LoadingView()
                state.error != null -> NotificationsErrorView(state.error, onRefresh)
                state.notifications.isEmpty() -> EmptyNotificationsView(onMarkAllRead)
                else -> NotificationsList(state.notifications, onMarkRead, onMarkAllRead)
            }
        }
    }
}

@Composable
private fun LoadingView() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
    }
}

@Composable
private fun NotificationsErrorView(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = message, style = MaterialTheme.typography.bodyLarge)
        Button(onClick = onRetry, modifier = Modifier.padding(top = 8.dp)) {
            Text(text = stringResource(id = R.string.notifications_retry))
        }
    }
}

@Composable
private fun EmptyNotificationsView(onMarkAllRead: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = stringResource(id = R.string.notifications_empty))
        Button(onClick = onMarkAllRead, modifier = Modifier.padding(top = 8.dp)) {
            Text(text = stringResource(id = R.string.notifications_mark_all))
        }
    }
}

@Composable
private fun NotificationsList(
    notifications: List<AlertNotification>,
    onMarkRead: (String) -> Unit,
    onMarkAllRead: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Button(
            onClick = onMarkAllRead,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(text = stringResource(id = R.string.notifications_mark_all))
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(notifications) { notification ->
                NotificationRow(notification, onMarkRead)
                Divider()
            }
        }
    }
}

@Composable
private fun NotificationRow(
    notification: AlertNotification,
    onMarkRead: (String) -> Unit
) {
    Column(modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp)) {
        Text(text = notification.title, style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = notification.message)
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = notification.createdAt?.toString() ?: "")
        if (!notification.isRead) {
            Button(onClick = { onMarkRead(notification.id) }, modifier = Modifier.padding(top = 8.dp)) {
                Text(text = stringResource(id = R.string.notifications_mark_read))
            }
        }
    }
}
