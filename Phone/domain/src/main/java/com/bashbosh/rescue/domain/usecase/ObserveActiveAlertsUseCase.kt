package com.bashbosh.rescue.domain.usecase

import com.bashbosh.rescue.core.common.AppResult
import com.bashbosh.rescue.domain.model.Alert
import kotlinx.coroutines.flow.Flow

interface ObserveActiveAlertsUseCase {
    operator fun invoke(): Flow<AppResult<List<Alert>>>
}
