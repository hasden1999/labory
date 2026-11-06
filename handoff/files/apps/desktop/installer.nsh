; ==============================================================================
; Labryo LIMS - Custom NSIS Installer Script
; يضمن إغلاق التطبيق والخدمات بأمان ومنع الملفات المقفلة وحماية بيانات المستخدم
; ==============================================================================

!macro customInit
  ; 0. التحقق الصارم من متطلبات النظام الأساسية (معمارية 64-bit وإصدار ويندوز 10 فما فوق)
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP|MB_OK "عذراً، هذا الإصدار يتطلب نظام تشغيل ويندوز بمعمارية 64-bit.$\r$\n$\r$\nللأنظمة بمعمارية 32-bit، يرجى استخدام نسخة (Labryo Legacy Edition) المخصصة لذلك."
    Abort
  ${EndIf}

  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP|MB_OK "عذراً، هذا الإصدار يتطلب نظام Windows 10 أو أحدث.$\r$\n$\r$\nلتشغيل النظام على Windows 7 أو Windows 8، يرجى تثبيت نسخة (Labryo Legacy Edition) المخصصة للأنظمة القديمة."
    Abort
  ${EndIf}

  ; 1. إغلاق أي نسخة شغالة من التطبيق فوراً قبل بدء الاستبدال
  DetailPrint "Checking and closing running instances of Labryo LIMS..."
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS Legacy - نظام لابريو للأنظمة القديمة.exe"'
  nsExec::Exec 'taskkill /F /IM "مختبر الرضا - إدارة المختبرات الطبية.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo.exe"'

  ; 2. إيقاف أي عملية Node تابعة لمحرك النظام الداخلي
  DetailPrint "Stopping internal backend engine processes..."
  nsExec::Exec 'powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like \"*@lab-managerdesktop*\" } | Stop-Process -Force -ErrorAction SilentlyContinue"'
  
  ; 3. إيقاف أي خدمة ويندوز مرتبطة بالنظام بأمان في حال كانت قيد التشغيل
  DetailPrint "Stopping Windows Services if running..."
  nsExec::Exec 'powershell -NoProfile -Command "Get-Service -Name LabryoLIMS, LabryoService, LabManager -ErrorAction SilentlyContinue | Where-Object { $$_.Status -eq \"Running\" } | Stop-Service -Force -ErrorAction SilentlyContinue"'

  ; مهلة ثانية واحدة للتأكد من تحرير كافة مقابض الملفات (File Handles) في الويندوز
  Sleep 1000
!macroend

!macro customInstall
  DetailPrint "Updating application shortcuts and registry..."
  
  ; تشغيل خدمة الويندوز إن كانت مثبتة ومضبوطة للعمل التلقائي
  DetailPrint "Starting active Windows Services if installed..."
  nsExec::Exec 'powershell -NoProfile -Command "Get-Service -Name LabryoLIMS, LabryoService, LabManager -ErrorAction SilentlyContinue | Where-Object { $$_.StartType -ne \"Disabled\" } | Start-Service -ErrorAction SilentlyContinue"'

  ; تأكيد عدم المساس بمجلد بيانات المستخدم (%APPDATA%\@lab-manager\desktop\data)
  ; تأكيد عدم المساس بمجلد بيانات المستخدم (%APPDATA%\@lab-manager\desktop\data)
  DetailPrint "Customer database and data directories preserved untouched."

  ; 4. فتح منافذ الشبكة المحلية تلقائياً في جدار الحماية (8080 لحواسيب المختبر الفرعية و 5000 للأجهزة الطبية)
  DetailPrint "Configuring Windows Firewall for LAN Multi-PC & Medical Analyzer connectivity..."
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Labryo LIMS LAN Server (8080)"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="Labryo LIMS LAN Server (8080)" dir=in action=allow protocol=TCP localport=8080'
  nsExec::Exec 'netsh advfirewall firewall delete rule name="Labryo Medical Analyzers Listener (5000)"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="Labryo Medical Analyzers Listener (5000)" dir=in action=allow protocol=TCP localport=5000'
!macroend

!macro customUnInstall
  ; عند إلغاء التثبيت: إغلاق العمليات والخدمات مع الإبقاء التام على بيانات المختبر
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"'
  nsExec::Exec 'taskkill /F /IM "Labryo LIMS Legacy - نظام لابريو للأنظمة القديمة.exe"'
  nsExec::Exec 'powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like \"*@lab-managerdesktop*\" } | Stop-Process -Force -ErrorAction SilentlyContinue"'
  nsExec::Exec 'powershell -NoProfile -Command "Get-Service -Name LabryoLIMS, LabryoService, LabManager -ErrorAction SilentlyContinue | Where-Object { $$_.Status -eq \"Running\" } | Stop-Service -Force -ErrorAction SilentlyContinue"'
!macroend
