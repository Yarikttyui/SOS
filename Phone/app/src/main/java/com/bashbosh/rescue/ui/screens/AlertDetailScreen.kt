package com.bashbosh.rescue.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.R
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.ui.screens.components.CompleteAlertDialog
import com.bashbosh.rescue.ui.viewmodel.AlertDetailState

@Composable
fun AlertDetailScreen(
    state: AlertDetailState,
    onBack: () -> Unit,
    onAccept: () -> Unit,
    onComplete: (String?) -> Unit
) {
    Surface(color = MaterialTheme.colorScheme.background) {
        when (state) {
            is AlertDetailState.Loading -> LoadingState()
            is AlertDetailState.Error -> ErrorState(state.message, onBack)
            is AlertDetailState.Loaded -> LoadedState(state.alert, onBack, onAccept, onComplete)
        }
    }
}

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorState(message: String, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = message, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center)
        Button(onClick = onBack, modifier = Modifier.padding(top = 16.dp)) {
            Text(text = stringResource(id = R.string.alert_detail_back))
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
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0A2146))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(painter = painterResource(id = R.drawable.ic_back), contentDescription = null, tint = Color.White)
            }
            Text(
                text = alert.title ?: stringResource(id = R.string.alert_card_title_fallback, alert.type.raw.uppercase()),
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White,
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = stringResource(id = R.string.alert_detail_status, alert.status.raw.uppercase()), fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = stringResource(id = R.string.alert_detail_description, alert.description ?: stringResource(id = R.string.alert_card_description_fallback)))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = stringResource(id = R.string.alert_detail_address, alert.address ?: "—"))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = stringResource(id = R.string.alert_detail_priority, alert.priority))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = stringResource(id = R.string.alert_detail_created_at, alert.formattedCreatedAt ?: "—"))

            Spacer(modifier = Modifier.height(24.dp))

            if (alert.isAvailable) {
                Button(onClick = onAccept, modifier = Modifier.fillMaxWidth()) {
                    Text(text = stringResource(id = R.string.alert_card_accept))
                }
            }
            if (alert.isInProgress) {
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
                Button(onClick = { showDialog = true }, modifier = Modifier.fillMaxWidth()) {
                    Text(text = stringResource(id = R.string.alert_card_complete))
                }
            }
        }
    }
}
