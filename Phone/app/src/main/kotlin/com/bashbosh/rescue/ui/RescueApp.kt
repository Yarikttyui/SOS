package com.bashbosh.rescue.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import com.bashbosh.rescue.core.designsystem.theme.RescueTheme
import com.bashbosh.rescue.navigation.RescueNavHost
import androidx.core.view.WindowCompat
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper

@Composable
fun RescueApp() {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = findActivity(view.context)?.window
            window?.statusBarColor = Color.Transparent.value.toInt()
            window?.navigationBarColor = Color.Transparent.value.toInt()
            WindowCompat.getInsetsController(window ?: return@SideEffect, view).isAppearanceLightStatusBars = false
        }
    }

    RescueTheme {
        RescueNavHost()
    }
}

private tailrec fun findActivity(context: Context): Activity? = when (context) {
    is Activity -> context
    is ContextWrapper -> findActivity(context.baseContext)
    else -> null
}
