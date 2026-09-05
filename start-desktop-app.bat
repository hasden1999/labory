@echo off
chcp 65001 >nul
title نظام لابريو الطبي - النسخة المكتبية
cd /d "%~dp0"

if exist ".\apps\desktop\dist\win-unpacked\Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe" (
    start "" ".\apps\desktop\dist\win-unpacked\Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"
) else (
    npm run desktop
)

exit
