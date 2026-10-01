@echo off
chcp 65001 >nul
title تشغيل نظام المختبر الطبي المحدث (Labryo LIMS Pro)
color 0b

echo ========================================================
echo   تشغيل نظام إدارة المختبرات الطبية المحدث (Labryo LIMS)
echo ========================================================
echo.

cd /d "D:\lab\apps\web"

:: فحص ما إذا كان السيرفر يعمل بالفعل على المنفذ 8080
netstat -ano | findstr :8080 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] خادم النظام يعمل بالفعل على المنفذ 8080.
) else (
    echo [1/2] جاري تشغيل خادم النظام المحدث...
    start /b "" cmd /c "npm run start"
    timeout /t 3 /nobreak >nul
)

echo [2/2] جاري فتح واجهة النظام في المتصفح...
start http://localhost:8080

echo.
echo ========================================================
echo  تم فتح النظام بنجاح على: http://localhost:8080
echo ========================================================
exit
