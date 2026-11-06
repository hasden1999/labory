#!/usr/bin/env bash
# ==============================================================================
# سكربت ترقية قاعدة البيانات والمخطط السريري (Bash / Linux)
# Zero-Downtime Database Migration
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SCHEMA_PATH="${ROOT_DIR}/apps/server/prisma/schema.prisma"
LOG_FILE="${ROOT_DIR}/backups/backup.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [LIS-MIGRATE] $*" | tee -a "${LOG_FILE}"
}

log "بدء فحص وتحديث مخطط قاعدة البيانات السريرية (Prisma Schema)..."

if [[ ! -f "${SCHEMA_PATH}" ]]; then
    echo "ملف schema.prisma غير موجود في: ${SCHEMA_PATH}" >&2
    exit 1
fi

log "1/3 التحقق من صيغة المخطط (prisma validate)..."
npx prisma validate --schema="${SCHEMA_PATH}"

log "2/3 مزامنة جداول الفحوصات والمرضى (prisma db push)..."
npx prisma db push --schema="${SCHEMA_PATH}" --accept-data-loss=false

log "3/3 توليد Prisma Client لمزامنة النماذج الطبية..."
npx prisma generate --schema="${SCHEMA_PATH}"

log "تم تحديث ومزامنة قاعدة البيانات السريرية بنجاح تام."
exit 0
