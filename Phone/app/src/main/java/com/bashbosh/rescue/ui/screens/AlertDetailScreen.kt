package com.bashbosh.rescue.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.R
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.ui.screens.components.CompleteAlertDialog
import com.bashbosh.rescue.ui.viewmodel.AlertDetailState
import com.bashbosh.rescue.ui.components.GlassCard
import com.bashbosh.rescue.ui.components.PrimaryGradientButton
import com.bashbosh.rescue.ui.components.RescueBackground
import com.bashbosh.rescue.ui.theme.PrimaryRose

@Composable
fun AlertDetailScreen(
    state: AlertDetailState,
    onBack: () -> Unit,
    onAccept: () -> Unit,
    onComplete: (String?) -> Unit
) {
    RescueBackground(modifier = Modifier.fillMaxSize()) {
        when (state) {
            is AlertDetailState.Loading -> LoadingState(modifier = Modifier.fillMaxSize())
            is AlertDetailState.Error -> ErrorState(state.message, onBack, modifier = Modifier.fillMaxWidth())
            is AlertDetailState.Loaded -> LoadedState(state.alert, onBack, onAccept, onComplete)
        }
    }
}

@Composable
private fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
    CircularProgressIndicator(color = MaterialTheme.colorScheme.secondary)
    }
}

@Composable
private fun ErrorState(
    message: String,
    onBack: () -> Unit,
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
            Text(text = message, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center)
            PrimaryGradientButton(
                text = stringResource(id = R.string.alert_detail_back),
                modifier = Modifier.fillMaxWidth(),
                onClick = onBack
            )
        }
    }
}

@Composable
private fun LoadedState(
    alert: Alert,
    onBack: () -> Unit,
    onAccept: () -> Unit,
    onComplete: (String?) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }

    if (showDialog) {
        CompleteAlertDialog(
            onDismiss = { showDialog = false },
            onConfirm = {
                onComplete(it)
                showDialog = false
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_back),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary
                    )
                }
                Text(
                    text = alert.title ?: stringResource(id = R.string.alert_card_title_fallback, alert.type.raw.uppercase()),
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = stringResource(id = R.string.alert_detail_status, alert.status.raw.uppercase()),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Bold
                )
                Text(text = stringResource(id = R.string.alert_detail_description, alert.description ?: stringResource(id = R.string.alert_card_description_fallback)))
                Text(text = stringResource(id = R.string.alert_detail_address, alert.address ?: "—"))
                Text(text = stringResource(id = R.string.alert_detail_priority, alert.priority))
                Text(text = stringResource(id = R.string.alert_detail_created_at, alert.formattedCreatedAt ?: "—"))
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            if (alert.isAvailable) {
                PrimaryGradientButton(
                    text = stringResource(id = R.string.alert_card_accept),
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onAccept
                )
            }
            if (alert.isInProgress) {
                OutlinedButton(
                    onClick = { showDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryRose)
                ) {
                    Text(text = stringResource(id = R.string.alert_card_complete))
                }
            }
        }
    }
}
