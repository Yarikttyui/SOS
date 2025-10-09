package com.bashbosh.rescue.ui.screens.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.bashbosh.rescue.core.designsystem.theme.RescueColors
import com.bashbosh.rescue.ui.screens.dashboard.model.AlertUiModel
import com.bashbosh.rescue.ui.screens.dashboard.viewmodel.DashboardViewModel

@Composable
fun DashboardScreen(
    paddingValues: PaddingValues,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val alerts by viewModel.alerts.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
        tonalElevation = 0.dp
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(top = paddingValues.calculateTopPadding() + 16.dp, bottom = 32.dp, start = 16.dp, end = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Активные вызовы",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            items(alerts) { alert ->
                AlertCard(alert)
            }
        }
    }
}

@Composable
private fun AlertCard(alert: AlertUiModel) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = alert.title,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
            )
            Surface(color = RescueColors.Midnight.copy(alpha = 0.05f)) {
                Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
                    Text(text = alert.description, style = MaterialTheme.typography.bodyLarge)
                    Text(text = "Приоритет: ${alert.priority}", style = MaterialTheme.typography.labelLarge)
                    Text(text = "Статус: ${alert.status}", style = MaterialTheme.typography.labelLarge)
                }
            }
        }
    }
}
