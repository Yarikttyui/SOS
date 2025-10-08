package com.bashbosh.rescue.data.dto

import com.google.gson.annotations.SerializedName

data class WebSocketMessageDto(
    @SerializedName("type") val type: String,
    @SerializedName("data") val data: AlertDto?
)
