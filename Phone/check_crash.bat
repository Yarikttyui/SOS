@echo off
echo Checking Android logcat for crash logs...
echo.
adb logcat -d | findstr /i "FATAL Exception AndroidRuntime"
echo.
echo Full crash log:
adb logcat -d | findstr /i "crash exception error fatal"
