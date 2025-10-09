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
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme: ColorScheme = darkColorScheme(
    primary = PrimaryRose,
    onPrimary = TextOnPrimary,
    secondary = AccentAmber,
    onSecondary = TextOnPrimary,
    tertiary = AccentViolet,
    background = MidnightBlue,
    onBackground = OnDark,
    surface = SlateNight,
    onSurface = OnDark,
    surfaceVariant = SlateNight.copy(alpha = 0.85f),
    onSurfaceVariant = OnDark,
    outline = OutlineSoft.copy(alpha = 0.4f)
)

private val LightColorScheme: ColorScheme = lightColorScheme(
    primary = PrimaryRose,
    onPrimary = TextOnPrimary,
    secondary = AccentAmber,
    onSecondary = TextOnPrimary,
    tertiary = AccentViolet,
    background = CardLight,
    onBackground = OnCard,
    surface = CardTint,
    onSurface = OnCard,
    surfaceVariant = CardLight,
    onSurfaceVariant = OnCard,
    outline = OutlineSoft
)

@Composable
fun RescueTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
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
