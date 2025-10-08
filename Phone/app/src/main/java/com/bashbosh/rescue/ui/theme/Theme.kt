package com.bashbosh.rescue.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme: ColorScheme = darkColorScheme(
    primary = PrimaryBlue,
    onPrimary = TextOnPrimary,
    secondary = SecondaryBlue,
    onSecondary = TextOnPrimary,
    tertiary = AccentTeal,
    background = Color(0xFF0F172A),
    onBackground = TextOnPrimary,
    surface = Color(0xFF16213A),
    onSurface = Color(0xFFECEFF4)
)

private val LightColorScheme: ColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    onPrimary = TextOnPrimary,
    secondary = SecondaryBlue,
    onSecondary = TextOnPrimary,
    tertiary = AccentTeal,
    background = SurfaceLight,
    onBackground = Color(0xFF0B172F),
    surface = Color.White,
    onSurface = Color(0xFF0B172F)
)

@Composable
fun RescueTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = RescueTypography,
        content = content
    )
}
