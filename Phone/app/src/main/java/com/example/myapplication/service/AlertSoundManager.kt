package com.example.myapplication.service

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

class AlertSoundManager(private val context: Context) {
    
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    
    init {
        vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }
    
    /**
     * Проигрывает громкий звук сирены при новом вызове
     */
    fun playAlertSound() {
        try {
            stopAlertSound() // Останавливаем предыдущий звук если играет
            
            // Используем системный звук уведомления (максимально громкий)
            val alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            
            mediaPlayer = MediaPlayer().apply {
                setDataSource(context, alertUri)
                
                // Настраиваем для максимальной громкости
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                
                // Устанавливаем максимальную громкость
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0)
                
                // Зацикливаем звук
                isLooping = true
                
                setOnPreparedListener {
                    it.start()
                    Log.d("AlertSoundManager", "Alert sound started")
                }
                
                setOnErrorListener { mp, what, extra ->
                    Log.e("AlertSoundManager", "MediaPlayer error: what=$what, extra=$extra")
                    true
                }
                
                prepareAsync()
            }
            
            // Добавляем вибрацию
            startVibration()
            
        } catch (e: Exception) {
            Log.e("AlertSoundManager", "Error playing alert sound", e)
        }
    }
    
    /**
     * Останавливает звук сирены
     */
    fun stopAlertSound() {
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
            mediaPlayer = null
            
            stopVibration()
            
            Log.d("AlertSoundManager", "Alert sound stopped")
        } catch (e: Exception) {
            Log.e("AlertSoundManager", "Error stopping alert sound", e)
        }
    }
    
    /**
     * Запускает вибрацию по паттерну (сирена)
     */
    private fun startVibration() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                // Паттерн: пауза 0мс, вибрация 500мс, пауза 200мс, повтор
                val timings = longArrayOf(0, 500, 200, 500, 200)
                val amplitudes = intArrayOf(0, 255, 0, 255, 0) // Максимальная амплитуда
                
                val effect = VibrationEffect.createWaveform(timings, amplitudes, 0)
                vibrator?.vibrate(effect)
            } else {
                // Для старых версий Android
                @Suppress("DEPRECATION")
                val pattern = longArrayOf(0, 500, 200, 500, 200)
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
            
            Log.d("AlertSoundManager", "Vibration started")
        } catch (e: Exception) {
            Log.e("AlertSoundManager", "Error starting vibration", e)
        }
    }
    
    /**
     * Останавливает вибрацию
     */
    private fun stopVibration() {
        try {
            vibrator?.cancel()
            Log.d("AlertSoundManager", "Vibration stopped")
        } catch (e: Exception) {
            Log.e("AlertSoundManager", "Error stopping vibration", e)
        }
    }
    
    /**
     * Проигрывает короткий звук уведомления
     */
    fun playNotificationSound() {
        try {
            val notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val ringtone = RingtoneManager.getRingtone(context, notificationUri)
            ringtone.play()
        } catch (e: Exception) {
            Log.e("AlertSoundManager", "Error playing notification sound", e)
        }
    }
    
    /**
     * Освобождение ресурсов
     */
    fun release() {
        stopAlertSound()
    }
}
