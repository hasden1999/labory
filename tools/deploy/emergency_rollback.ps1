# ==============================================================================
# سكربت التراجع السريع في حالات الطوارئ السريرية (PowerShell - Windows)
# Clinical Emergency Rollback
# ==============================================================================
[CmdletBinding()]
param (
    [string]$RootDir = (Resolve-Path "$PSScriptRoot\..\..").Path,
    [switch]$RestoreDb
)

$ErrorActionPreference = "Stop"
$BackupRoot = Join-Path $RootDir "backups"
$LogFile = Join-Path $BackupRoot "rollback.log"

function Write-Log {
    param([string]$Message)
    $Formatted = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [LIS-ROLLBACK] $Message"
    Write-Host $Formatted -ForegroundColor Red
    Add-Content -Path $LogFile -Value $Formatted -Encoding UTF8
}

Write-Log "🚨 تنبيه طوارئ: بدء إجراءات التراجع الفوري لنظام المختبرات السريرية 🚨"

# 1. استعادة كود الإصدار السابق من Git
$PrevCommitFile = Join-Path $BackupRoot "PREVIOUS_COMMIT"
if (Test-Path $PrevCommitFile) {
    $PrevCommit = (Get-Content -Path $PrevCommitFile -Raw).Trim()
    Write-Log "العودة إلى الـ Git Commit السابق المستقر: $PrevCommit"
    Push-Location $RootDir
    git checkout $PrevCommit
    Pop-Location
} else {
    Write-Log "تنبيه: ملف PREVIOUS_COMMIT غير موجود. التراجع خطوة واحدة للخلف عبر Git..."
    Push-Location $RootDir
    git checkout HEAD~1
    Pop-Location
}

# 2. استعادة ملفات البيئة والإعدادات من أحدث نسخة احتياطية صالحة
$LatestBackupPointer = Join-Path $BackupRoot "LATEST_VALID_BACKUP"
if (Test-Path $LatestBackupPointer) {
    $LatestBackupDir = (Get-Content -Path $LatestBackupPointer -Raw).Trim()
    if (Test-Path $LatestBackupDir) {
        $BakEnv = Join-Path $LatestBackupDir ".env.bak"
        if (Test-Path $BakEnv) {
            Write-Log "استرجاع ملف الإعدادات .env من النسخة الاحتياطية..."
            Copy-Item -Path $BakEnv -Destination (Join-Path $RootDir ".env") -Force
        }

        # إذا طلب المستخدم أو تم تمرير -RestoreDb
        if ($RestoreDb) {
            Write-Log "⚠️ تفعيل خيار استعادة قاعدة البيانات الطبية بالكامل من النسخة الاحتياطية..."
            $BakDb = Get-ChildItem -Path $LatestBackupDir -Filter "*.db" | Select-Object -First 1
            if ($BakDb) {
                $TargetDb = Join-Path $RootDir "apps\server\prisma\lab.db"
                Copy-Item -Path $BakDb.FullName -Destination $TargetDb -Force
                Write-Log "تمت استعادة قاعدة بيانات الفحوصات الطبية بنجاح: $($BakDb.Name)"
            }
        }
    }
}

# 3. إعادة توليد Prisma ومحاولة إعادة تشغيل الخدمات
Push-Location $RootDir
Write-Log "تحديث Prisma Client..."
npx prisma generate --schema="apps\server\prisma\schema.prisma"
Pop-Location

Write-Log "✅ اكتملت إجراءات التراجع الفوري بنجاح. يرجى إعادة تشغيل التطبيق والتحقق من الجاهزية."
exit 0
