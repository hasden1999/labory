# ==============================================================================
# السكربت الرئيسي المنسق لنشر وترقية نظام المختبرات (PowerShell - Windows)
# Master Lab Deployment Orchestrator
# ==============================================================================
[CmdletBinding()]
param (
    [string]$RootDir = (Resolve-Path "$PSScriptRoot\..\..").Path,
    [switch]$PublishDesktop,
    [switch]$BuildInstaller
)

$ErrorActionPreference = "Stop"
$ScriptsDir = "$RootDir\tools\deploy"

function Write-Step {
    param([string]$Step, [string]$Title)
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  [$Step] $Title" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
}

try {
    # 0. تسجيل الـ Commit الحالي
    Write-Step "0/5" "توثيق نقطة العودة السابقة (Commit Tracking)..."
    $BackupDir = Join-Path $RootDir "backups"
    if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
    Push-Location $RootDir
    $CurrentCommit = (git rev-parse HEAD).Trim()
    Set-Content -Path (Join-Path $BackupDir "PREVIOUS_COMMIT") -Value $CurrentCommit
    Pop-Location
    Write-Host "نقطة العودة المحفوظة: $CurrentCommit" -ForegroundColor Cyan

    # 1. النسخ الاحتياطي السريري
    Write-Step "1/5" "تنفيذ الحماية والنسخ الاحتياطي السريري لقاعدة البيانات والإعدادات..."
    powershell -ExecutionPolicy Bypass -File (Join-Path $ScriptsDir "pre_deploy_backup.ps1") -RootDir $RootDir

    # 2. ترقية المخطط وقاعدة البيانات
    Write-Step "2/5" "مزامنة وترقية مخطط قاعدة البيانات السريرية (Prisma)..."
    powershell -ExecutionPolicy Bypass -File (Join-Path $ScriptsDir "run_migrations.ps1") -RootDir $RootDir

    # 3. بناء واجهة الويب ومحرك النتائج
    Write-Step "3/5" "بناء وتجميع واجهة الويب ومحرك التحاليل السريرية (npm run build:web)..."
    Push-Location $RootDir
    npm run build:web
    Pop-Location

    # 4. بناء وتوزيع تطبيق سطح المكتب للمستخدمين (إن طلب)
    if ($BuildInstaller -or $PublishDesktop) {
        Write-Step "4/5" "بناء وتوزيع إصدار تطبيق سطح المكتب..."
        $PublishArgs = @((Join-Path $ScriptsDir "publish_desktop_release.js"))
        if ($BuildInstaller) { $PublishArgs += "--build" }
        if ($PublishDesktop) { $PublishArgs += "--publish" }
        Push-Location $RootDir
        node @PublishArgs
        Pop-Location
    } else {
        Write-Step "4/5" "تخطي بناء المثبت المكتبي (للبناء والنشر استخدم -BuildInstaller أو -PublishDesktop)..."
    }

    # 5. رسالة النجاح
    Write-Step "5/5" "اكتملت عملية الترقية بنجاح تام!"
    Write-Host "النظام جاهز ومستقر في بيئة الإنتاج السريري." -ForegroundColor Green
} catch {
    Write-Host "`n❌ حدث خطأ حرج أثناء عملية الترقية: $_" -ForegroundColor Red
    Write-Host "🚨 جاري تفعيل خطة الطوارئ والتراجع التلقائي لحماية بيانات المختبر..." -ForegroundColor Red
    powershell -ExecutionPolicy Bypass -File (Join-Path $ScriptsDir "emergency_rollback.ps1") -RootDir $RootDir
    exit 1
}
