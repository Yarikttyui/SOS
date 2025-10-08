package com.bashbosh.rescue.ui.screens.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.R

@Composable
fun CompleteAlertDialog(
    onDismiss: () -> Unit,
    onConfirm: (String?) -> Unit
) {
    val report = remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = stringResource(id = R.string.complete_alert_title)) },
        text = {
            Column {
                Text(text = stringResource(id = R.string.complete_alert_message))
                OutlinedTextField(
                    value = report.value,
                    onValueChange = { report.value = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    placeholder = { Text(text = stringResource(id = R.string.complete_alert_placeholder)) }
                )
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(report.value.takeIf { it.isNotBlank() }) }) {
                Text(text = stringResource(id = R.string.complete_alert_confirm))
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text(text = stringResource(id = R.string.complete_alert_cancel))
            }
        }
    )
}
