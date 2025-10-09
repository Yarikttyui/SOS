package com.bashbosh.rescue.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import com.bashbosh.rescue.BuildConfig
import com.bashbosh.rescue.core.common.AppResult
import com.bashbosh.rescue.data.local.RescueLocalDataSource
import com.bashbosh.rescue.data.network.RescueApiClient
import com.bashbosh.rescue.domain.model.Alert
import com.bashbosh.rescue.domain.usecase.ObserveActiveAlertsUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideRescueApiClient(): RescueApiClient =
        RescueApiClient(baseUrl = BuildConfig.API_BASE_URL)

    @Provides
    @Singleton
    fun providePreferencesDataStore(
        @ApplicationContext context: Context
    ): DataStore<Preferences> = PreferenceDataStoreFactory.create(
        produceFile = { context.preferencesDataStoreFile("rescue_prefs") }
    )

    @Provides
    @Singleton
    fun provideLocalDataSource(
        dataStore: DataStore<Preferences>
    ): RescueLocalDataSource = RescueLocalDataSource(dataStore)

    @Provides
    @Singleton
    fun provideObserveActiveAlertsUseCase(
        apiClient: RescueApiClient
    ): ObserveActiveAlertsUseCase = ObserveActiveAlertsUseCaseImpl(apiClient)
}

private class ObserveActiveAlertsUseCaseImpl(
    private val apiClient: RescueApiClient
) : ObserveActiveAlertsUseCase {
    override fun invoke(): Flow<AppResult<List<Alert>>> = flow {
        emit(AppResult.Loading)
        emit(apiClient.fetchAlerts())
    }
}
