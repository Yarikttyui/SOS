@echo off
chcp 65001 >nul
echo ============================================================
echo 🗄️  ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ SOS RESCUE SYSTEM
echo ============================================================
echo.

cd /d "%~dp0"

REM Проверка виртуального окружения
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Виртуальное окружение не найдено!
    echo Сначала создайте его командой: python -m venv venv
    pause
    exit /b 1
)

REM Активация виртуального окружения
call venv\Scripts\activate.bat

REM Запуск скрипта инициализации
python init_database.py

echo.
echo ============================================================
pause
