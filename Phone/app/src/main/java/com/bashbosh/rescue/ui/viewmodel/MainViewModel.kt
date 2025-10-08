package com.bashbosh.rescue.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bashbosh.rescue.app.RescueAppContainer
import com.bashbosh.rescue.domain.model.UserSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

sealed class SessionUiState {
    object Loading : SessionUiState()
    data class Ready(val session: UserSession, val error: String? = null) : SessionUiState()
    data class Error(val message: String) : SessionUiState()
}

class MainViewModel(
    private val container: RescueAppContainer
) : ViewModel() {

    private val authRepository = container.authRepository

    private val _sessionState: MutableStateFlow<SessionUiState> = MutableStateFlow(SessionUiState.Loading)
    val sessionState: StateFlow<SessionUiState> = _sessionState

    init {
        observeSession()
    }

    private fun observeSession() {
        viewModelScope.launch {
            authRepository.session.collectLatest { session ->
                _sessionState.value = SessionUiState.Ready(session)
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _sessionState.value = SessionUiState.Loading
            authRepository.login(email, password)
                .onSuccess { session ->
                    _sessionState.value = SessionUiState.Ready(session)
                }
                .onFailure { error ->
                    _sessionState.value = SessionUiState.Error(error.localizedMessage ?: "Login failed")
                }
        }
    }

    fun register(email: String, password: String, fullName: String?, phone: String?) {
        viewModelScope.launch {
            _sessionState.value = SessionUiState.Loading
            authRepository.register(email, password, fullName, phone)
                .onSuccess {
                    login(email, password)
                }
                .onFailure { error ->
                    _sessionState.value = SessionUiState.Error(error.localizedMessage ?: "Registration failed")
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
