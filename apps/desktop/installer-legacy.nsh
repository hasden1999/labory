; ==============================================================================
; Labryo LIMS Universal Edition - Custom NSIS Installer Script
; يدعم كافة أنظمة ويندوز (Windows 7 / 8 / 8.1 / 10 / 11) للنواتين 32-bit و 64-bit
; ==============================================================================

!macro customInit
  ; إغلاق سريع وفوري لأي نسخة شغالة دون استخدام PowerShell البطيء على الأنظمة القديمة
  nsExec::Exec 'taskkill /F /IM "LabryoLIMS.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS Legacy - نظام لابريو للأنظمة القديمة.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo.exe"'
!macroend

!macro customInstall
  DetailPrint "Preparing Labryo LIMS engine and shortcuts..."

  ; إغلاق أي عملية محرك سابقة عالقة على المنفذ 8080 بأمان وسرعة
  nsExec::Exec 'cmd.exe /C "for /f \"tokens=5\" %a in (\'netstat -aon ^| findstr :8080 ^| findstr LISTENING\') do taskkill /f /pid %a"'

  ; فتح منافذ الشبكة المحلية في جدار الحماية (تعمل تلقائياً إن توفرت الصلاحية)
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Labryo LIMS LAN Server (8080)"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="Labryo LIMS LAN Server (8080)" dir=in action=allow protocol=TCP localport=8080'
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Labryo Medical Analyzers Listener (5000)"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="Labryo Medical Analyzers Listener (5000)" dir=in action=allow protocol=TCP localport=5000'

  ; تأكيد عدم المساس بمجلد بيانات المستخدم (%APPDATA%\@lab-manager\desktop\data)
  DetailPrint "Customer database and data directories preserved untouched."
!macroend

!macro customUnInstall
  ; عند إلغاء التثبيت: إغلاق العمليات مع الإبقاء التام على بيانات المختبر
  nsExec::Exec 'taskkill /F /IM "LabryoLIMS.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS Legacy - نظام لابريو للأنظمة القديمة.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"'
  nsExec::Exec 'cmd.exe /C "for /f \"tokens=5\" %a in (\'netstat -aon ^| findstr :8080 ^| findstr LISTENING\') do taskkill /f /pid %a"'
!macroend
