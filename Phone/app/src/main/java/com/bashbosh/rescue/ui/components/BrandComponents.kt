package com.bashbosh.rescue.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bashbosh.rescue.ui.theme.AccentMagenta
import com.bashbosh.rescue.ui.theme.AccentSunrise
import com.bashbosh.rescue.ui.theme.PrimaryRose
import com.bashbosh.rescue.ui.theme.SecondaryIndigo
import com.bashbosh.rescue.ui.theme.SurfaceLight

@Composable
fun RescueBackground(
    modifier: Modifier = Modifier,
    topGlowColor: Color = PrimaryRose.copy(alpha = 0.2f),
    sideGlowColor: Color = SecondaryIndigo.copy(alpha = 0.18f),
    content: @Composable BoxScope.() -> Unit
) {
    Box(modifier = modifier.background(SurfaceLight)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // top radial glow
            drawCircle(
                color = topGlowColor,
                radius = width * 0.8f,
                center = Offset(width * 0.5f, -height * 0.1f)
            )

            // side gradient
            withTransform({
                translate(left = width * 0.7f, top = height * 0.2f)
            }) {
                drawCircle(
                    color = sideGlowColor,
                    radius = width * 0.5f
                )
            }
        }
        content()
    }
}

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 28.dp,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(cornerRadius),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.5f))
    ) {
        Box(modifier = Modifier.background(Color.White.copy(alpha = 0.85f))) {
            content()
        }
    }
}

@Composable
fun PrimaryGradientButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            contentColor = Color.Transparent,
            disabledContainerColor = Color.Transparent,
            disabledContentColor = Color.Transparent
        ),
        shape = RoundedCornerShape(28.dp),
        contentPadding = PaddingValues(0.dp)
    ) {
        val gradientColors = if (enabled) {
            listOf(PrimaryRose, AccentSunrise, AccentMagenta)
        } else {
            listOf(
                PrimaryRose.copy(alpha = 0.4f),
                AccentSunrise.copy(alpha = 0.4f),
                AccentMagenta.copy(alpha = 0.4f)
            )
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.horizontalGradient(colors = gradientColors),
                    shape = RoundedCornerShape(28.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            val contentColor = if (enabled) Color.White else Color.White.copy(alpha = 0.7f)
            Text(
                text = text,
                style = MaterialTheme.typography.titleMedium,
                color = contentColor,
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(horizontal = 24.dp, vertical = 12.dp)
            )
        }
    }
}
