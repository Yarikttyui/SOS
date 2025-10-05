package com.example.myapplication.data.api

import com.example.myapplication.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface RescueApiService {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @GET("auth/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    @GET("sos")
    suspend fun getAlerts(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null,
        @Query("type") type: String? = null
    ): Response<List<SOSAlert>>
    
    @POST("sos")
    suspend fun createAlert(
        @Header("Authorization") token: String,
        @Body request: CreateAlertRequest
    ): Response<SOSAlert>
    
    @PATCH("sos/{alert_id}")
    suspend fun updateAlert(
        @Header("Authorization") token: String,
        @Path("alert_id") alertId: String,
        @Body request: UpdateAlertRequest
    ): Response<SOSAlert>
    
    @GET("sos/{alert_id}")
    suspend fun getAlert(
        @Header("Authorization") token: String,
        @Path("alert_id") alertId: String
    ): Response<SOSAlert>
}
