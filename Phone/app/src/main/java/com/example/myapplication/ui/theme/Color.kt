package com.example.myapplication.ui.theme

import androidx.compose.ui.graphics.Color

// --- Brand Core Palette ----------------------------------------------------

val AuroraRose = Color(0xFFF43F5E)
val AuroraRoseLight = Color(0xFFFF8FA6)
val AuroraRoseDark = Color(0xFFDB1D4E)

val EmberCrimson = Color(0xFFEF4444)
val BlazingOrange = Color(0xFFF97316)

val SkyPulse = Color(0xFF3B82F6)
val SkyPulseLight = Color(0xFF60A5FA)
val SkyPulseDark = Color(0xFF1D4ED8)

val AuroraViolet = Color(0xFFC084FC)
val AuroraVioletLight = Color(0xFFD8B4FE)
val AuroraVioletDark = Color(0xFF7C3AED)

val LuminousAmber = Color(0xFFFBBF24)
val SignalEmerald = Color(0xFF22C55E)

// --- Extended Neutrals -----------------------------------------------------

val Slate10 = Color(0xFFF8FAFC)
val Slate50 = Color(0xFFF1F5F9)
val Slate100 = Color(0xFFE2E8F0)
val Slate200 = Color(0xFFCBD5F5)
val Slate300 = Color(0xFFA0AEC0)
val Slate400 = Color(0xFF64748B)
val Slate500 = Color(0xFF475569)
val Slate600 = Color(0xFF334155)
val Slate700 = Color(0xFF1F2937)
val Slate800 = Color(0xFF111827)
val Slate900 = Color(0xFF0F172A)
val Slate950 = Color(0xFF020617)

// --- Surfaces & Overlays ---------------------------------------------------

val DayBackground = Color(0xFFFBFBFE)
val NightBackground = Slate950

val GlassWhite = Color(0xD9FFFFFF)
val GlassDark = Color(0xCC1E293B)

val CardSurfaceLight = Color(0xFFFFFFFF)
val CardSurfaceDark = Color(0xFF111B2A)

// --- Legacy Aliases (to keep existing usages compiling) --------------------

val EmergencyRed = AuroraRose
val EmergencyRedLight = AuroraRoseLight
val EmergencyRedDark = AuroraRoseDark

val SuccessGreen = SignalEmerald
val SuccessGreenLight = Color(0xFF4ADE80)
val SuccessGreenDark = Color(0xFF15803D)

val WarningYellow = LuminousAmber
val WarningYellowLight = Color(0xFFFCD34D)
val WarningYellowDark = Color(0xFFB45309)

val InfoBlue = SkyPulse
val InfoBlueLight = SkyPulseLight
val InfoBlueDark = SkyPulseDark

val Gray50 = Slate10
val Gray100 = Slate50
val Gray200 = Slate100
val Gray300 = Slate300
val Gray400 = Slate400
val Gray500 = Slate500
val Gray600 = Slate600
val Gray700 = Slate700
val Gray800 = Slate800
val Gray900 = Slate900

val BackgroundLight = DayBackground
val BackgroundDark = NightBackground

val SurfaceLight = CardSurfaceLight
val SurfaceDark = CardSurfaceDark

// Purple (compatibility values kept for older composables)
val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)