#!/usr/bin/env bash
# ==============================================================================
# السكربت الرئيسي المنسق لنشر وترقية نظام المختبرات (Bash / Linux)
# Master Lab Deployment Orchestrator
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

log_step() {
    echo -e "\n\033[1;36m========================================================\033[0m"
    echo -e "  \033[1;32m[$1] $2\033[0m"
    echo -e "\033[1;36m========================================================\033[0m"
}

error_handler() {
    local line_no=$1
    echo -e "\n\033[1;31m[CRITICAL FAILURE] حدث خطأ في السطر ${line_no}! جاري تشغيل التراجع التلقائي لحماية بيانات المرضى...\033[0m"
    bash "${SCRIPT_DIR}/emergency_rollback.sh"
    exit 1
}
trap 'error_handler $LINENO' ERR

log_step "0/5" "توثيق نقطة العودة السابقة (Commit Tracking)..."
mkdir -p "${ROOT_DIR}/backups"
cd "${ROOT_DIR}"
git rev-parse HEAD > "${ROOT_DIR}/backups/PREVIOUS_COMMIT"

log_step "1/5" "النسخ الاحتياطي السريري لقاعدة البيانات والإعدادات..."
bash "${SCRIPT_DIR}/pre_deploy_backup.sh"

log_step "2/5" "مزامنة وترقية مخطط قاعدة البيانات السريرية (Prisma)..."
bash "${SCRIPT_DIR}/run_migrations.sh"

log_step "3/5" "بناء واجهة الويب ومحرك التحاليل السريرية..."
npm run build:web

log_step "4/5" "فحص ومعالجة حزم سطح المكتب..."
node "${SCRIPT_DIR}/publish_desktop_release.js" "$@"

log_step "5/5" "اكتملت ترقية نظام المختبر بنجاح تام!"
