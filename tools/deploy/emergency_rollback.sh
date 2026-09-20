#!/usr/bin/env bash
# ==============================================================================
# سكربت التراجع السريع في حالات الطوارئ السريرية (Bash / Linux)
# Clinical Emergency Rollback
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_ROOT="${ROOT_DIR}/backups"
LOG_FILE="${BACKUP_ROOT}/rollback.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [LIS-ROLLBACK] $*" | tee -a "${LOG_FILE}"
}

log "🚨 تنبيه طوارئ: بدء إجراءات التراجع الفوري لنظام المختبرات السريرية 🚨"

# 1. استعادة كود الإصدار السابق
PREV_COMMIT_FILE="${BACKUP_ROOT}/PREVIOUS_COMMIT"
if [[ -f "${PREV_COMMIT_FILE}" ]]; then
    PREV_COMMIT=$(cat "${PREV_COMMIT_FILE}")
    log "العودة إلى الـ Git Commit السابق المستقر: ${PREV_COMMIT}"
    cd "${ROOT_DIR}"
    git checkout "${PREV_COMMIT}"
else
    log "تنبيه: ملف PREVIOUS_COMMIT غير موجود. التراجع خطوة واحدة للخلف عبر Git..."
    cd "${ROOT_DIR}"
    git checkout HEAD~1
fi

# 2. استعادة ملفات البيئة وقاعدة البيانات
LATEST_BACKUP_POINTER="${BACKUP_ROOT}/LATEST_VALID_BACKUP"
if [[ -f "${LATEST_BACKUP_POINTER}" ]]; then
    LATEST_BACKUP_DIR=$(cat "${LATEST_BACKUP_POINTER}")
    if [[ -f "${LATEST_BACKUP_DIR}/.env.bak" ]]; then
        log "استرجاع ملف الإعدادات .env..."
        cp "${LATEST_BACKUP_DIR}/.env.bak" "${ROOT_DIR}/.env"
    fi

    if [[ "${1:-}" == "--restore-db" ]]; then
        log "⚠️ استعادة قاعدة البيانات السريرية كاملة..."
        DB_BACKUP=$(find "${LATEST_BACKUP_DIR}" -name "*.db" | head -n 1)
        if [[ -n "${DB_BACKUP}" && -f "${DB_BACKUP}" ]]; then
            cp "${DB_BACKUP}" "${ROOT_DIR}/apps/server/prisma/lab.db"
            log "تمت استعادة قاعدة بيانات الفحوصات الطبية بنجاح."
        fi
    fi
fi

# 3. إعادة توليد Prisma
cd "${ROOT_DIR}"
npx prisma generate --schema="${ROOT_DIR}/apps/server/prisma/schema.prisma"

log "✅ اكتملت إجراءات التراجع بنجاح."
exit 0
