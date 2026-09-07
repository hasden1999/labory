@echo off
chcp 65001 >nul
title أداة توليد مفاتيح تفعيل برنامج المختبر الطبي - Labryo LIMS
cd /d "%~dp0"

node tools\generate-license-key.js %*

pause
