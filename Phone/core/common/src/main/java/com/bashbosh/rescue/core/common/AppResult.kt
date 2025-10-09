package com.bashbosh.rescue.core.common

sealed class AppResult<out T> {
    data class Success<T>(val value: T) : AppResult<T>()
    data class Error(val throwable: Throwable) : AppResult<Nothing>()
    data object Loading : AppResult<Nothing>()

    inline fun <R> map(transform: (T) -> R): AppResult<R> = when (this) {
        is Success -> Success(transform(value))
        is Error -> this
        Loading -> Loading
    }
}

inline fun <T> AppResult<T>.onSuccess(action: (T) -> Unit): AppResult<T> = apply {
    if (this is AppResult.Success) action(value)
}

inline fun <T> AppResult<T>.onError(action: (Throwable) -> Unit): AppResult<T> = apply {
    if (this is AppResult.Error) action(throwable)
}

inline fun <T> AppResult<T>.onLoading(action: () -> Unit): AppResult<T> = apply {
    if (this is AppResult.Loading) action()
}
