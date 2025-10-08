package com.bashbosh.rescue.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class LoginViewModel : ViewModel() {

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password

    private val _validationError = MutableStateFlow<String?>(null)
    val validationError: StateFlow<String?> = _validationError

    private val _isRegisterMode = MutableStateFlow(false)
    val isRegisterMode: StateFlow<Boolean> = _isRegisterMode

    private val _fullName = MutableStateFlow("")
    val fullName: StateFlow<String> = _fullName

    private val _phone = MutableStateFlow("")
    val phone: StateFlow<String> = _phone

    fun onEmailChange(value: String) {
        _email.value = value
        _validationError.value = null
    }

    fun onPasswordChange(value: String) {
        _password.value = value
        _validationError.value = null
    }

    fun onFullNameChange(value: String) {
        _fullName.value = value
    }

    fun onPhoneChange(value: String) {
        _phone.value = value
    }

    fun toggleMode() {
        _isRegisterMode.value = !_isRegisterMode.value
    }

    fun validate(): Boolean {
        val email = _email.value.trim()
        val password = _password.value

        if (email.isBlank() || !email.contains("@")) {
            _validationError.value = "Введите корректный e-mail"
            return false
        }
        if (password.length < 8) {
            _validationError.value = "Пароль должен содержать минимум 8 символов"
            return false
        }
        if (_isRegisterMode.value) {
            if (_fullName.value.isBlank()) {
                _validationError.value = "Укажите ФИО"
                return false
            }
        }
        _validationError.value = null
        return true
    }

    fun reset() {
        _email.value = ""
        _password.value = ""
        _fullName.value = ""
        _phone.value = ""
        _validationError.value = null
    }
}
