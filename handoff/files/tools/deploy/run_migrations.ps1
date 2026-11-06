# ==============================================================================
# سكربت ترقية قاعدة البيانات والمخطط السريري (PowerShell - Windows)
# Zero-Downtime Database Migration
# ==============================================================================
[CmdletBinding()]
param (
    [string]$RootDir = (Resolve-Path "$PSScriptRoot\..\..").Path
)

$ErrorActionPreference = "Stop"
$LogFile = Join-Path $RootDir "backups\backup.log"

function Write-Log {
    param([string]$Message)
    $Formatted = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [LIS-MIGRATE] $Message"
    Write-Host $Formatted -ForegroundColor Magenta
    Add-Content -Path $LogFile -Value $Formatted -Encoding UTF8
}

Write-Log "بدء فحص وتحديث مخطط قاعدة البيانات السريرية (Prisma Schema)..."

$SchemaPath = Join-Path $RootDir "apps\server\prisma\schema.prisma"
if (!(Test-Path $SchemaPath)) {
    throw "ملف schema.prisma غير موجود في: $SchemaPath"
}

# 1. التحقق من سلامة المخطط
Write-Log "1/3 التحقق من صيغة المخطط (prisma validate)..."
npx prisma validate --schema="$SchemaPath"

# 2. تطبيق التعديلات (db push بأمان مع عدم السماح بحذف البيانات دون تأكيد)
Write-Log "2/3 مزامنة جداول الفحوصات والمرضى (prisma db push)..."
npx prisma db push --schema="$SchemaPath" --accept-data-loss=false

# 3. توليد عميل Prisma المحدث
Write-Log "3/3 توليد Prisma Client لمزامنة النماذج الطبية..."
npx prisma generate --schema="$SchemaPath"

Write-Log "تم تحديث ومزامنة قاعدة البيانات السريرية بنجاح تام."
exit 0
