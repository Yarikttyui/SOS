package com.example.myapplication.service

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager as AndroidLocationManager
import android.os.Bundle
import android.util.Log
import androidx.core.content.ContextCompat

class LocationManager(private val context: Context) {
    
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as AndroidLocationManager
    private var currentLocation: Location? = null
    private var locationListener: LocationListener? = null
    
    companion object {
        private const val TAG = "LocationManager"
        private const val MIN_TIME_BW_UPDATES = 10000L // 10 seconds
        private const val MIN_DISTANCE_CHANGE_FOR_UPDATES = 10f // 10 meters
    }
    
    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    fun startLocationUpdates(onLocationUpdate: (Double, Double) -> Unit) {
        if (!hasLocationPermission()) {
            Log.e(TAG, "Location permission not granted")
            return
        }
        
        try {
            // Try GPS first
            if (locationManager.isProviderEnabled(AndroidLocationManager.GPS_PROVIDER)) {
                locationListener = object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        currentLocation = location
                        onLocationUpdate(location.latitude, location.longitude)
                        Log.d(TAG, "Location updated: ${location.latitude}, ${location.longitude}")
                    }
                    
                    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                    override fun onProviderEnabled(provider: String) {}
                    override fun onProviderDisabled(provider: String) {}
                }
                
                locationManager.requestLocationUpdates(
                    AndroidLocationManager.GPS_PROVIDER,
                    MIN_TIME_BW_UPDATES,
                    MIN_DISTANCE_CHANGE_FOR_UPDATES,
                    locationListener!!
                )
                
                // Get last known location
                val lastLocation = locationManager.getLastKnownLocation(AndroidLocationManager.GPS_PROVIDER)
                if (lastLocation != null) {
                    currentLocation = lastLocation
                    onLocationUpdate(lastLocation.latitude, lastLocation.longitude)
                }
            }
            
            // Try network location as fallback
            if (locationManager.isProviderEnabled(AndroidLocationManager.NETWORK_PROVIDER)) {
                val networkListener = object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        if (currentLocation == null || location.accuracy < currentLocation!!.accuracy) {
                            currentLocation = location
                            onLocationUpdate(location.latitude, location.longitude)
                            Log.d(TAG, "Network location updated: ${location.latitude}, ${location.longitude}")
                        }
                    }
                    
                    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                    override fun onProviderEnabled(provider: String) {}
                    override fun onProviderDisabled(provider: String) {}
                }
                
                locationManager.requestLocationUpdates(
                    AndroidLocationManager.NETWORK_PROVIDER,
                    MIN_TIME_BW_UPDATES,
                    MIN_DISTANCE_CHANGE_FOR_UPDATES,
                    networkListener
                )
                
                // Get last known network location
                val lastNetworkLocation = locationManager.getLastKnownLocation(AndroidLocationManager.NETWORK_PROVIDER)
                if (lastNetworkLocation != null && currentLocation == null) {
                    currentLocation = lastNetworkLocation
                    onLocationUpdate(lastNetworkLocation.latitude, lastNetworkLocation.longitude)
                }
            }
            
        } catch (e: SecurityException) {
            Log.e(TAG, "Security exception: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Error getting location: ${e.message}")
        }
    }
    
    fun stopLocationUpdates() {
        try {
            locationListener?.let {
                locationManager.removeUpdates(it)
            }
            locationListener = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping location updates: ${e.message}")
        }
    }
    
    fun getCurrentLocation(): Pair<Double, Double>? {
        return currentLocation?.let {
            Pair(it.latitude, it.longitude)
        }
    }
}
