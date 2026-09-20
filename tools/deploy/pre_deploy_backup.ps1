# ==============================================================================
# سكربت النسخ الاحتياطي السريري والتحقق من السلامة (PowerShell - Windows)
# Pre-Deployment Clinical Safeguards
# ==============================================================================
[CmdletBinding()]
param (
    [string]$RootDir = (Resolve-Path "$PSScriptRoot\..\..").Path
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $RootDir "backups\$Timestamp"
$LogFile = Join-Path $RootDir "backups\backup.log"

function Write-Log {
    param([string]$Message)
    $timeStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Formatted = "[$timeStr] [LIS-BACKUP] $Message"
    Write-Host $Formatted -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value $Formatted -Encoding UTF8
}

function Write-Err {
    param([string]$Message)
    $timeStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Formatted = "[$timeStr] [LIS-ERROR] $Message"
    Write-Host $Formatted -ForegroundColor Red
    Add-Content -Path $LogFile -Value $Formatted -Encoding UTF8
    throw $Message
}

# 1. إنشاء مجلد النسخ الاحتياطية
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Log "=== بدء بروتوكول النسخ الاحتياطي الوقائي لنظام المختبرات الطبية ==="

# 2. نسخ ملفات البيئة والإعدادات الحساسة
$EnvFile = Join-Path $RootDir ".env"
if (Test-Path $EnvFile) {
    Write-Log "1/3 أخذ لقطة لملف الإعدادات .env..."
    $BakEnv = Join-Path $BackupDir ".env.bak"
    Copy-Item -Path $EnvFile -Destination $BakEnv -Force
    $EnvHash = (Get-FileHash -Path $BakEnv -Algorithm SHA256).Hash
    Set-Content -Path (Join-Path $BackupDir ".env.sha256") -Value $EnvHash
    Write-Log "تم حفظ بصمة ملف الإعدادات: $EnvHash"
}

# 3. نسخ وفحص سلامة قاعدة البيانات الطبية
$DbFile = Join-Path $RootDir "apps\server\prisma\lab.db"
if (Test-Path $DbFile) {
    Write-Log "2/3 جاري نسخ قاعدة بيانات الفحوصات والمرضى السريرية lab.db..."
    $TargetDb = Join-Path $BackupDir "lab_clinical_$Timestamp.db"
    
    Copy-Item -Path $DbFile -Destination $TargetDb -Force
    
    $DbSize = (Get-Item $TargetDb).Length
    if ($DbSize -lt 1024) {
        Write-Err "حجم ملف قاعدة البيانات صغير جداً وغير طبيعي: $DbSize بايت! تم إيقاف العملية لحماية البيانات."
    }

    # فحص تكامل رأس قاعدة البيانات
    $Stream = [System.IO.File]::OpenRead($TargetDb)
    $Bytes = New-Object byte[] 16
    $null = $Stream.Read($Bytes, 0, 16)
    $Stream.Close()
    $Header = [System.Text.Encoding]::UTF8.GetString($Bytes)

    if (-not $Header.StartsWith("SQLite format 3")) {
        Write-Err "رأس ملف قاعدة البيانات تالف أو غير صالح: $Header"
    }

    $DbHash = (Get-FileHash -Path $TargetDb -Algorithm SHA256).Hash
    Set-Content -Path "$TargetDb.sha256" -Value $DbHash
    $SizeMB = [math]::Round($DbSize / 1MB, 2)
    Write-Log "تم تأكيد سلامة رأس وتكامل قاعدة البيانات الطبية. الحجم: $SizeMB MB والبصمة: $DbHash"
} else {
    Write-Log "ملاحظة: لم يتم العثور على ملف lab.db محلي."
}

# 4. حفظ مسار النسخة الاحتياطية
$LatestPointer = Join-Path $RootDir "backups\LATEST_VALID_BACKUP"
Set-Content -Path $LatestPointer -Value $BackupDir -Encoding UTF8
Write-Log "تم تسجيل المسار المرجعي للطوارئ: $BackupDir"

# 5. تنظيف النسخ القديمة الأكبر من 30 يوماً
$RetentionLimit = (Get-Date).AddDays(-30)
Get-ChildItem -Path (Join-Path $RootDir "backups") -Directory | Where-Object {
    $_.CreationTime -lt $RetentionLimit -and $_.Name -match '^\d{8}_\d{6}$'
} | ForEach-Object {
    Write-Log "حذف نسخة احتياطية منتهية الصلاحية: $($_.FullName)"
    Remove-Item -Path $_.FullName -Recurse -Force
}

Write-Log "=== اكتمل النسخ الاحتياطي السريري بنجاح تام ==="
exit 0
