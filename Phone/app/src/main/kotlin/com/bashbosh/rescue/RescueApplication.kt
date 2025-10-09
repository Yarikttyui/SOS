package com.bashbosh.rescue

import android.app.Application
import com.bashbosh.rescue.BuildConfig
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class RescueApplication : Application()
{
	override fun onCreate() {
		super.onCreate()
		if (BuildConfig.DEBUG) {
			Timber.plant(Timber.DebugTree())
		}
	}
}
