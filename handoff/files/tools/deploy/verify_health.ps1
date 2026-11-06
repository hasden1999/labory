# ==============================================================================
# سكربت فحص سلامة وجاهزية نظام المختبرات (PowerShell - Windows)
# Automated Clinical Health Check
# ==============================================================================
[CmdletBinding()]
param (
    [string]$BackendUrl = "http://127.0.0.1:8000/health",
    [string]$WebUrl = "http://127.0.0.1:8080",
    [int]$MaxRetries = 10,
    [int]$RetryDelaySec = 3
)

$ErrorActionPreference = "Continue"

function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [LIS-HEALTH-CHECK] $Message" -ForegroundColor Yellow
}

Write-Log "بدء فحص استجابة خدمات المختبر..."

# 1. فحص خادم الـ Backend (Fastify Port 8000)
$BackendHealthy = $false
for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
        $response = Invoke-RestMethod -Uri $BackendUrl -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($response.status -eq "OK") {
            Write-Log "المحاولة [$i/$MaxRetries]: خادم المختبر الخلفي (Backend) يعمل بكفاءة ($($response.app))."
            $BackendHealthy = $true
            break
        }
    } catch {
        Write-Log "المحاولة [$i/$MaxRetries]: خادم الـ Backend غير مستجيب بعد. الانتظار $RetryDelaySec ثوانٍ..."
        Start-Sleep -Seconds $RetryDelaySec
    }
}

if (-not $BackendHealthy) {
    Write-Host "❌ فشل فحص صحة خادم الـ Backend على: $BackendUrl" -ForegroundColor Red
    exit 1
}

# 2. فحص واجهة الويب السريرية (Next.js Port 8080)
$WebHealthy = $false
for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
        $webRes = Invoke-WebRequest -Uri $WebUrl -Method Head -TimeoutSec 3 -ErrorAction Stop
        if ($webRes.StatusCode -ge 200 -and $webRes.StatusCode -lt 400) {
            Write-Log "المحاولة [$i/$MaxRetries]: واجهة الويب السريرية ومحرك الاستقبال مستجيب بنجاح (HTTP $($webRes.StatusCode))."
            $WebHealthy = $true
            break
        }
    } catch {
        Write-Log "المحاولة [$i/$MaxRetries]: واجهة الويب قيد التجهيز. الانتظار $RetryDelaySec ثوانٍ..."
        Start-Sleep -Seconds $RetryDelaySec
    }
}

if (-not $WebHealthy) {
    Write-Host "❌ فشل فحص صحة واجهة الويب على: $WebUrl" -ForegroundColor Red
    exit 1
}

Write-Host "✅ تم التحقق: كافة خدمات المختبر السريرية (Backend & Web) تعمل بنجاح وجاهزة لاستقبال الفحوصات." -ForegroundColor Green
exit 0
