package com.bashbosh.rescue.core.designsystem.theme

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
    primary = RescueColors.Rose,
    onPrimary = Color.White,
    secondary = RescueColors.Amber,
    onSecondary = Color.Black.copy(alpha = 0.8f),
    tertiary = RescueColors.Violet,
    background = RescueColors.Midnight,
    onBackground = RescueColors.OnDark,
    surface = RescueColors.SlateNight,
    onSurface = RescueColors.OnDark
)

private val LightColorScheme: ColorScheme = lightColorScheme(
    primary = RescueColors.Rose,
    onPrimary = Color.White,
    secondary = RescueColors.Amber,
    onSecondary = Color.Black.copy(alpha = 0.8f),
    tertiary = RescueColors.Violet,
    background = RescueColors.Snow,
    onBackground = RescueColors.OnLight,
    surface = RescueColors.Cloud,
    onSurface = RescueColors.OnLight
)

@Composable
fun RescueTheme(
    useDarkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (useDarkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        useDarkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = RescueTypography,
        content = content
    )
}
