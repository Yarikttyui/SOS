package com.example.myapplication.ui.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.ui.theme.EmergencyRed
import com.example.myapplication.ui.theme.EmergencyRedDark
import com.example.myapplication.ui.theme.EmergencyRedLight
import com.example.myapplication.ui.theme.Gray100
import com.example.myapplication.ui.theme.Gray200
import com.example.myapplication.ui.theme.Gray500
import com.example.myapplication.ui.theme.Gray600
import com.example.myapplication.ui.theme.Gray900

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onLogin: (
        email: String,
        password: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF020617), Color(0xFF0F172A))
                )
            )
    ) {
        AuroraGlow(modifier = Modifier.align(Alignment.TopEnd).padding(top = 32.dp))
        AuroraGlow(modifier = Modifier.align(Alignment.BottomStart), reverse = true)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            HeroSection()

            LoginCard(
                email = email,
                onEmailChange = {
                    email = it
                    errorMessage = null
                },
                password = password,
                onPasswordChange = {
                    password = it
                    errorMessage = null
                },
                passwordVisible = passwordVisible,
                onTogglePasswordVisibility = { passwordVisible = !passwordVisible },
                isLoading = isLoading,
                errorMessage = errorMessage,
                onSubmit = {
                    if (email.isBlank() || password.isBlank()) {
                        errorMessage = "Заполните все поля"
                        return@LoginCard
                    }

                    isLoading = true
                    errorMessage = null

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
                onPrefill = { prefEmail, prefPassword ->
                    email = prefEmail
                    password = prefPassword
                }
            )

            SupportSection()
        }
    }
}

@Composable
private fun HeroSection() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(50),
            color = Color.White.copy(alpha = 0.1f),
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
            modifier = Modifier
                .clip(RoundedCornerShape(50))
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 18.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "✨",
                    fontSize = 16.sp
                )
                Text(
                    text = "Rescue Operations Cloud",
                    color = Color.White.copy(alpha = 0.9f),
                    letterSpacing = 0.14.sp,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        Box(
            modifier = Modifier
                .size(96.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(Color.White.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "🚨", fontSize = 56.sp)
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Экосистема спасательных операций",
                fontSize = 30.sp,
                lineHeight = 38.sp,
                textAlign = TextAlign.Center,
                color = Color.White,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Отправляйте SOS, управляйте бригадами и получайте аналитику ИИ в одном интерфейсе.",
                textAlign = TextAlign.Center,
                color = Color.White.copy(alpha = 0.72f),
                fontSize = 15.sp,
                lineHeight = 22.sp
            )
        }

        StatHighlights()
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StatHighlights() {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        maxItemsInEachRow = 2
    ) {
        FeatureCard(
            title = "Безопасность",
            subtitle = "ISO/IEC 27001",
            accent = Color(0xFF34D399)
        )
        FeatureCard(
            title = "Скорость",
            subtitle = "до 1.2 сек",
            accent = Color(0xFFFBBF24)
        )
        FeatureCard(
            title = "Надёжность",
            subtitle = "24/7/365",
            accent = Color(0xFF60A5FA)
        )
    }
}

@Composable
private fun FeatureCard(
    title: String,
    subtitle: String,
    accent: Color
) {
    Surface(
        color = Color.White.copy(alpha = 0.08f),
        shape = RoundedCornerShape(20.dp),
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
        modifier = Modifier
            .widthIn(min = 150.dp, max = 220.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = accent
            )
            Text(
                text = title.uppercase(),
                fontSize = 11.sp,
                letterSpacing = 1.5.sp,
                color = Color.White.copy(alpha = 0.6f),
                fontWeight = FontWeight.Medium
            )
            Text(
                text = subtitle,
                fontSize = 16.sp,
                color = Color.White,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun LoginCard(
    email: String,
    onEmailChange: (String) -> Unit,
    password: String,
    onPasswordChange: (String) -> Unit,
    passwordVisible: Boolean,
    onTogglePasswordVisibility: () -> Unit,
    isLoading: Boolean,
    errorMessage: String?,
    onSubmit: () -> Unit,
    onPrefill: (String, String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .graphicsLayer { alpha = 0.6f }
                .shadow(
                    elevation = 24.dp,
                    shape = RoundedCornerShape(32.dp),
                    clip = false
                )
        )

        Card(
            shape = RoundedCornerShape(32.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 28.dp, vertical = 32.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Text(
                    text = "Войти в систему",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Gray900
                )

                Text(
                    text = "Используйте корпоративный аккаунт для доступа к панели управления спасательными операциями.",
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    color = Gray600
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = onEmailChange,
                    label = { Text("Email адрес") },
                    placeholder = { Text("dispatcher@rescue.ru", color = Gray500) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Email,
                            contentDescription = "Email",
                            tint = EmergencyRed
                        )
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    enabled = !isLoading,
                    shape = RoundedCornerShape(18.dp),
                    textStyle = MaterialTheme.typography.bodyLarge.copy(color = Gray900),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmergencyRed,
                        unfocusedBorderColor = Gray200,
                        focusedLabelColor = EmergencyRed,
                        unfocusedLabelColor = Gray500,
                        cursorColor = EmergencyRed
                    )
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = onPasswordChange,
                    label = { Text("Пароль") },
                    placeholder = { Text("Введите пароль", color = Gray500) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Пароль",
                            tint = EmergencyRed
                        )
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = onTogglePasswordVisibility) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = if (passwordVisible) "Скрыть пароль" else "Показать пароль",
                                tint = Gray500
                            )
                        }
                    },
                    enabled = !isLoading,
                    shape = RoundedCornerShape(18.dp),
                    textStyle = MaterialTheme.typography.bodyLarge.copy(color = Gray900),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmergencyRed,
                        unfocusedBorderColor = Gray200,
                        focusedLabelColor = EmergencyRed,
                        unfocusedLabelColor = Gray500,
                        cursorColor = EmergencyRed
                    )
                )

                AnimatedVisibility(
                    visible = errorMessage != null,
                    enter = fadeIn() + slideInVertically(),
                    exit = fadeOut()
                ) {
                    Surface(
                        color = EmergencyRedLight.copy(alpha = 0.18f),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, EmergencyRedLight.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = errorMessage.orEmpty(),
                            color = EmergencyRedDark,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(14.dp)
                        )
                    }
                }

                Button(
                    onClick = onSubmit,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(58.dp),
                    enabled = !isLoading,
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                    contentPadding = PaddingValues()
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                brush = Brush.linearGradient(
                                    listOf(Color(0xFFFB7185), Color(0xFFEF4444))
                                ),
                                shape = RoundedCornerShape(18.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(26.dp),
                                color = Color.White
                            )
                        } else {
                            Text(
                                text = "Войти в систему",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White
                            )
                        }
                    }
                }

                Divider(color = Gray100, thickness = 1.dp)

                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Быстрый вход для тестирования",
                        fontWeight = FontWeight.Medium,
                        fontSize = 13.sp,
                        color = Gray600
                    )

                    QuickLoginRow(
                        isLoading = isLoading,
                        onPrefill = onPrefill
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun QuickLoginRow(
    isLoading: Boolean,
    onPrefill: (String, String) -> Unit
) {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        maxItemsInEachRow = 2
    ) {
        QuickLoginButton(
            label = "Спасатель",
            emoji = "🚒",
            gradient = Brush.linearGradient(listOf(Color(0xFFF43F5E), Color(0xFFFB7185))),
            enabled = !isLoading
        ) {
            onPrefill("rescuer@test.ru", "Test1234")
        }

        QuickLoginButton(
            label = "Гражданин",
            emoji = "👤",
            gradient = Brush.linearGradient(listOf(Color(0xFF3B82F6), Color(0xFF60A5FA))),
            enabled = !isLoading
        ) {
            onPrefill("citizen@test.ru", "Test1234")
        }
    }
}

@Composable
private fun QuickLoginButton(
    label: String,
    emoji: String,
    gradient: Brush,
    enabled: Boolean,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.14f)),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.White.copy(alpha = 0.04f),
            contentColor = Color.White
        ),
        modifier = Modifier
            .widthIn(min = 150.dp, max = 220.dp)
            .height(58.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .background(gradient, shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = emoji, fontSize = 16.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(label, fontSize = 12.sp, color = Color.White)
        }
    }
}

@Composable
private fun SupportSection() {
    Surface(
        color = Color.White.copy(alpha = 0.1f),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SupportRow(
                text = "Шифрование TLS 1.3 и контроль доступа по ролям"
            )
            SupportRow(
                text = "ИИ-помощник анализирует сообщения в реальном времени"
            )
        }
    }
}

@Composable
private fun SupportRow(text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = Color(0xFF38BDF8)
            )
        }
        Text(
            text = text,
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.85f),
            lineHeight = 18.sp
        )
    }
}

@Composable
private fun AuroraGlow(modifier: Modifier = Modifier, reverse: Boolean = false) {
    val gradient = if (!reverse) {
        Brush.radialGradient(
            colors = listOf(Color(0x66FBBF24), Color(0x33F43F5E), Color.Transparent)
        )
    } else {
        Brush.radialGradient(
            colors = listOf(Color(0x443B82F6), Color(0x338B5CF6), Color.Transparent)
        )
    }

    Box(
        modifier = modifier
            .size(240.dp)
            .graphicsLayer {
                translationX = if (reverse) -120f else 120f
                translationY = if (reverse) 140f else -140f
            }
            .background(gradient, shape = CircleShape)
    )
}