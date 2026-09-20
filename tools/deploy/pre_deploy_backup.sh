#!/usr/bin/env bash
# ==============================================================================
# سكربت النسخ الاحتياطي السريري والتحقق من السلامة (Bash / Linux / Git-Bash)
# Pre-Deployment Clinical Safeguards
# ==============================================================================
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${ROOT_DIR}/backups/${TIMESTAMP}"
LOG_FILE="${ROOT_DIR}/backups/backup.log"

mkdir -p "${BACKUP_DIR}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [LIS-BACKUP] $*" | tee -a "${LOG_FILE}"
}

error_exit() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [LIS-ERROR] $*" | tee -a "${LOG_FILE}" >&2
    exit 1
}

log "=== بدء بروتوكول النسخ الاحتياطي الوقائي لنظام المختبرات الطبية ==="

# 1. نسخ ملف الإعدادات الحساسة
ENV_FILE="${ROOT_DIR}/.env"
if [[ -f "${ENV_FILE}" ]]; then
    log "1/3 أخذ لقطة لملف الإعدادات .env..."
    cp -p "${ENV_FILE}" "${BACKUP_DIR}/.env.bak"
    sha256sum "${BACKUP_DIR}/.env.bak" > "${BACKUP_DIR}/.env.sha256"
fi

# 2. نسخ وفحص سلامة قاعدة البيانات الطبية
DB_FILE="${ROOT_DIR}/apps/server/prisma/lab.db"
if [[ -f "${DB_FILE}" ]]; then
    log "2/3 جاري نسخ قاعدة بيانات الفحوصات والمرضى السريرية (lab.db)..."
    TARGET_DB="${BACKUP_DIR}/lab_clinical_${TIMESTAMP}.db"
    
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "${DB_FILE}" ".backup '${TARGET_DB}'"
        INTEGRITY=$(sqlite3 "${TARGET_DB}" "PRAGMA integrity_check;")
        if [[ "${INTEGRITY}" != "ok" ]]; then
            error_exit "فشل فحص تكامل قاعدة بيانات المختبر: ${INTEGRITY}"
        fi
    else
        cp -p "${DB_FILE}" "${TARGET_DB}"
    fi

    # التحقق من الرأس
    FILE_SIZE=$(stat -c%s "${TARGET_DB}" 2>/dev/null || stat -f%z "${TARGET_DB}")
    if [[ ${FILE_SIZE} -lt 1024 ]]; then
        error_exit "حجم ملف قاعدة البيانات صغير جداً وغير طبيعي (${FILE_SIZE} bytes)!"
    fi

    sha256sum "${TARGET_DB}" > "${TARGET_DB}.sha256"
    log "تم التحقق وتوثيق بصمة قاعدة البيانات السريرية بنجاح."
fi

# 3. توثيق المسار المرجعي
echo "${BACKUP_DIR}" > "${ROOT_DIR}/backups/LATEST_VALID_BACKUP"

# 4. تنظيف النسخ القديمة
find "${ROOT_DIR}/backups" -mindepth 1 -maxdepth 1 -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

log "=== اكتمل النسخ الاحتياطي السريري بنجاح تام ==="
exit 0
