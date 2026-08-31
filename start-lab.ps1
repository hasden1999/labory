Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   تشغيل نظام إدارة المختبرات Lab Manager   " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

Set-Location -Path "d:\lab"

Write-Host "1. تشغيل السيرفر الخلفي Fastify (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:\lab'; npm run dev:server"

Write-Host "2. تشغيل واجهة المستخدم Next.js (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:\lab'; npm run dev:web"

Write-Host ""
Write-Host "تم تشغيل الخدمات في نافذتين جديدتين!" -ForegroundColor Green
Write-Host "رابط الواجهة الموحد: http://localhost:3000" -ForegroundColor Cyan
