package com.example.myapplication.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onLogin: (String, String, onSuccess: () -> Unit, onError: (String) -> Unit) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Logo/Title
                Text(
                    text = "🚨",
                    fontSize = 64.sp
                )
                
                Text(
                    text = "Служба спасения",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Text(
                    text = "Вход в систему",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Email field
                OutlinedTextField(
                    value = email,
                    onValueChange = { 
                        email = it
                        errorMessage = null
                    },
                    label = { Text("Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    enabled = !isLoading
                )
                
                // Password field
                OutlinedTextField(
                    value = password,
                    onValueChange = { 
                        password = it
                        errorMessage = null
                    },
                    label = { Text("Пароль") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = if (passwordVisible) 
                        VisualTransformation.None 
                    else 
                        PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) 
                                    Icons.Default.Visibility 
                                else 
                                    Icons.Default.VisibilityOff,
                                contentDescription = if (passwordVisible) 
                                    "Скрыть пароль" 
                                else 
                                    "Показать пароль"
                            )
                        }
                    },
                    enabled = !isLoading
                )
                
                // Error message
                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 14.sp,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Login button
                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            errorMessage = "Заполните все поля"
                            return@Button
                        }
                        
                        isLoading = true
                        errorMessage = null
                        
                        // Call login with callbacks
                        onLogin(
                            email,
                            password,
                            {
                                isLoading = false
                                onLoginSuccess()
                            },
                            { error ->
                                isLoading = false
                                errorMessage = error
                            }
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Войти", fontSize = 16.sp)
                    }
                }
                
                // Quick test logins
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Быстрый вход:",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextButton(
                        onClick = {
                            email = "rescuer@test.ru"
                            password = "Test1234"
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Спасатель", fontSize = 12.sp)
                    }
                    
                    TextButton(
                        onClick = {
                            email = "citizen@test.ru"
                            password = "Test1234"
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Гражданин", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
