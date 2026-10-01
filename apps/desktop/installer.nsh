; ==============================================================================
; Labryo LIMS - Custom NSIS Installer Script
; يضمن إغلاق التطبيق والخدمات بأمان ومنع الملفات المقفلة وحماية بيانات المستخدم
; ==============================================================================

!macro customInit
  ; 1. إغلاق أي نسخة شغالة من التطبيق فوراً قبل بدء الاستبدال
  DetailPrint "Checking and closing running instances of Labryo LIMS..."
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"'
  nsExec::Exec 'taskkill /F /IM "مختبر الرضا - إدارة المختبرات الطبية.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo.exe"'

  ; 2. إيقاف أي عملية Node تابعة لمحرك النظام الداخلي
  DetailPrint "Stopping internal backend engine processes..."
  nsExec::Exec 'powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like \"*@lab-managerdesktop*\" } | Stop-Process -Force -ErrorAction SilentlyContinue"'
  
  ; 3. إيقاف أي خدمة ويندوز مرتبطة بالنظام (في حال كانت منصبة كـ Windows Service)
  DetailPrint "Stopping Windows Services if present..."
  nsExec::Exec 'net stop "LabryoLIMS"'
  nsExec::Exec 'net stop "LabryoService"'
  nsExec::Exec 'net stop "LabManager"'

  ; مهلة ثانية واحدة للتأكد من تحرير كافة مقابض الملفات (File Handles) في الويندوز
  Sleep 1000
!macroend

!macro customInstall
  DetailPrint "Updating application shortcuts and registry..."
  
  ; ضمان تشغيل خدمة الويندوز إن وجدت بعد انتهاء التثبيت بالمسار الجديد
  nsExec::Exec 'net start "LabryoLIMS"'
  nsExec::Exec 'net start "LabryoService"'
  nsExec::Exec 'net start "LabManager"'

  ; تأكيد عدم المساس بمجلد بيانات المستخدم (%APPDATA%\@lab-manager\desktop\data)
  DetailPrint "Customer database and data directories preserved untouched."
!macroend

!macro customUnInstall
  ; عند إلغاء التثبيت: إغلاق العمليات والخدمات مع الإبقاء التام على بيانات المختبر
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"'
  nsExec::Exec 'powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like \"*@lab-managerdesktop*\" } | Stop-Process -Force -ErrorAction SilentlyContinue"'
  nsExec::Exec 'net stop "LabryoLIMS"'
  nsExec::Exec 'net stop "LabryoService"'
  nsExec::Exec 'net stop "LabManager"'
!macroend
