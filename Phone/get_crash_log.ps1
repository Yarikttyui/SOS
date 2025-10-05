Write-Host "Получение логов краша приложения..." -ForegroundColor Yellow
Write-Host ""

# Очистка старых логов
adb logcat -c

Write-Host "Логи очищены. Теперь:" -ForegroundColor Green
Write-Host "1. Запустите приложение на телефоне"
Write-Host "2. Войдите в аккаунт"
Write-Host "3. Дождитесь краша"
Write-Host "4. Нажмите ENTER здесь"
Write-Host ""
Read-Host "Нажмите ENTER после краша"

Write-Host ""
Write-Host "Получение логов..." -ForegroundColor Yellow

# Получаем только логи нашего приложения
adb logcat -d | Select-String -Pattern "com.example.myapplication|AndroidRuntime|FATAL" -Context 10 | Out-File -FilePath "crash_log.txt"

Write-Host ""
Write-Host "Логи сохранены в crash_log.txt" -ForegroundColor Green
Write-Host "Показываю последние 100 строк:" -ForegroundColor Yellow
Write-Host ""

Get-Content "crash_log.txt" | Select-Object -Last 100
