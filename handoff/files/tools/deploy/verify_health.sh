#!/usr/bin/env bash
# ==============================================================================
# سكربت فحص سلامة وجاهزية نظام المختبرات (Bash / Linux)
# Automated Clinical Health Check
# ==============================================================================
set -euo pipefail

BACKEND_URL="${1:-http://127.0.0.1:8000/health}"
WEB_URL="${2:-http://127.0.0.1:8080}"
MAX_RETRIES=10
RETRY_DELAY=3

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [LIS-HEALTH-CHECK] $*"
}

log "بدء فحص استجابة خدمات المختبر..."

# 1. فحص خادم الـ Backend (Fastify Port 8000)
BACKEND_OK=0
for ((i=1; i<=MAX_RETRIES; i++)); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 4 "${BACKEND_URL}" || echo "000")
    if [[ "${STATUS}" == "200" ]]; then
        log "المحاولة [${i}/${MAX_RETRIES}]: خادم المختبر الخلفي (Backend) يعمل بكفاءة (HTTP 200)."
        BACKEND_OK=1
        break
    else
        log "المحاولة [${i}/${MAX_RETRIES}]: خادم الـ Backend غير مستجيب (الرمز: ${STATUS}). الانتظار ${RETRY_DELAY} ثوانٍ..."
        sleep "${RETRY_DELAY}"
    fi
done

if [[ ${BACKEND_OK} -ne 1 ]]; then
    echo "❌ فشل فحص صحة خادم الـ Backend على: ${BACKEND_URL}" >&2
    exit 1
fi

# 2. فحص واجهة الويب السريرية (Next.js Port 8080)
WEB_OK=0
for ((i=1; i<=MAX_RETRIES; i++)); do
    WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 4 "${WEB_URL}" || echo "000")
    if [[ "${WEB_STATUS}" =~ ^(200|301|302|307|308)$ ]]; then
        log "المحاولة [${i}/${MAX_RETRIES}]: واجهة الويب السريرية مستجيبة بنجاح (HTTP ${WEB_STATUS})."
        WEB_OK=1
        break
    else
        log "المحاولة [${i}/${MAX_RETRIES}]: واجهة الويب قيد التجهيز (الرمز: ${WEB_STATUS}). الانتظار ${RETRY_DELAY} ثوانٍ..."
        sleep "${RETRY_DELAY}"
    fi
done

if [[ ${WEB_OK} -ne 1 ]]; then
    echo "❌ فشل فحص صحة واجهة الويب على: ${WEB_URL}" >&2
    exit 1
fi

log "✅ تم التحقق: كافة خدمات المختبر السريرية (Backend & Web) تعمل بنجاح وجاهزة لاستقبال الفحوصات."
exit 0
