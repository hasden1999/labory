Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   تشغيل نظام إدارة المختبرات Lab Manager   " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

Set-Location -Path "d:\lab"

Write-Host "1. تشغيل السيرفر الخلفي Fastify (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:\lab'; npm run dev:server"

Write-Host "2. تشغيل واجهة المستخدم Next.js فائقة السرعة (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:\lab'; npm run start:web"

Write-Host ""
Write-Host "تم تشغيل الخدمات بنمط الأداء الفائق!" -ForegroundColor Green
Write-Host "رابط الواجهة في المتصفح: http://localhost:8080" -ForegroundColor Cyan
Start-Process "http://localhost:8080"
