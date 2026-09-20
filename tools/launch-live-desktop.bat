@echo off
title Labryo LIMS - Live Dev Preview
cd /d "D:\lab"
node tools\dev-desktop.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Process exited with error code: %ERRORLEVEL%
    pause
)
