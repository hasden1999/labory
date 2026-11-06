# تقرير وكيل الأمن السيبراني (01-Security Agent)

**تاريخ الفحص:** 2026-11-05  
**المشرف العام:** رئيس فريق هندسة البرمجيات والمراجعة الفنية  
**حالة الفحص:** مكتمل بدقة عالية وقراءة فقط (Read-Only)  
**نسخة النظام الخاضعة للفحص:** Labryo LIMS v2.1.1

---

## 📌 ملخص النتائج الأمنية (Executive Security Summary)
- 🔴 **حرج (Critical):** 3 ملاحظات (تجاوز حماية الشبكة والاقتران بتزوير Host Header، توليد توكن النسخ الاحتياطي دون تسجيل دخول إداري، ومسارات Fastify كاملة للعينات والمالية والمرضى دون أي مصادقة).
- 🟠 **عالٍ (High):** 3 ملاحظات (مفتاح الختم العتادي الثابت وتزييف كاش الترخيص، تشغيل أوامر Shell عبر cmd.exe غير المعقم في أتمتة واتساب، وتنفيذ سكربت بصلاحيات غير مقيدة في المجلد المؤقت).
- 🟡 **متوسط (Medium):** 2 ملاحظات (فتح الروابط عبر setWindowOpenHandler دون تقييد البروتوكول، وغياب Rate Limiting على مسار تسجيل الدخول).
- 🟢 **منخفض (Low):** 0 ملاحظة.

---

## 🔍 الملاحظات التفصيلية بالأدلة البرمجية

### [SEC-001] تجاوز حماية الشبكة واقتران الأجهزة بتزوير ترويسة المضيف 🔴 حرج (Critical)
- **الموقع:** `apps/web/src/middleware.ts:8-15` و `apps/web/src/middleware.ts:83-85`
- **المشكلة:**
  تعتمد دالة `isLoopback(req)` على ترويسة `Host` القادمة في طلب الـ HTTP لتحديد ما إذا كان المتصل هو السيرفر المحلي المركزي أم جهاز خارجي. ونظراً لأن خادم Next.js المستقل في بيئة Node لا يملأ خاصية `req.ip` وتكون قيمتها خالية دائماً، فإن الشرط `if (!socketIp) return true;` يعتمد حصرياً على فحص نص المضيف:
  ```typescript
  const socketIp = ((req as any).ip || '').trim();
  const rawHost = req.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!isLoopbackHost) return false;
  if (!socketIp) return true;
  ```
  وبالتالي عند تمرير طلب يحمل `Host: localhost:8080`:
  ```typescript
  // 2. Allow Central Server (loopback) full access to all pages and APIs
  if (isLoopback(request)) {
    return NextResponse.next();
  }
  ```
- **الأثر:**
  أي جهاز أو هاتف غير مصرح له متصل بنفس الشبكة المحلية للمختبر (LAN أو Wi-Fi) يستطيع إرسال طلبات بـ `Host: localhost:8080`، مما يجعله يتجاوز جدار الحماية بالكامل ويتخطى متطلب الاقتران (`x-device-token`) وصفحة `/connect`، ويحصل على وصول غير مقيد لكافة صفحات النظام واستمارات التحاليل والبيانات الطبية.
- **الحل المقترح:**
  إلغاء الاعتماد تماماً على ترويسة `Host` كمحدد أمني وحيد للهوية المحلية، واستخراج عنوان المقبس الفعلي (Socket IP) عبر خادم الوكيل أو السيرفر المستقل، أو إغلاق الاستثناء التلقائي وإلزام وجود توكن مصادقة لجميع العمليات:
  ```typescript
  // لا تثق مطلقاً بترويسة Host إذا كان socketIp غير متوفر
  if (!socketIp) {
    return false; // Fail-closed: رفض اعتبار الاتصال محلياً إذا تعذر إثبات عنوان المقبس
  }
  ```
- **الجهد:** صغير (Small).

---

### [SEC-002] توليد توكن النسخ الاحتياطي دون مصادقة إدارية 🔴 حرج (Critical)
- **الموقع:** `apps/web/src/app/api/backup/session/route.ts:13-23` و `apps/web/src/app/api/backup/session/route.ts:46-48`
- **المشكلة:**
  يقوم مسار `GET /api/backup/session` بتوليد وتسليم توكن إداري كامل الصلاحيات (`createBackupSessionToken`) دون التحقق من تسجيل دخول المستخدم الحالي كمدير نظام (Admin Role)، ويكتفي بفحص المضيف المحلي عبر ترويسة `Host`:
  ```typescript
  const rawHost = request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  if (!isStrictLoopbackHost(host)) {
    return NextResponse.json({ success: false, message: 'غير مصرح...' }, { status: 403 });
  }
  ...
  const secret = getOrCreateBackupSecret();
  const token = await createBackupSessionToken(secret);
  ```
- **الأثر:**
  بالتزامن مع ثغرة تزوير ترويسة المضيف (`Host: localhost`)، يستطيع أي جهاز متصل بالشبكة المحلية الحصول على توكن موقع بـ HMAC للنسخ الاحتياطي، ثم استدعاء `/api/backup/export` لسحب كامل قاعدة بيانات المرضى وسجلاتهم الطبية والمالية (PHI)، أو استدعاء `/api/backup/restore` واستبدال قاعدة البيانات بنسخة تالفة أو خبيثة وتعطيل المختبر.
- **الحل المقترح:**
  إلزام المسار بالتحقق من وجود جلسة دخول نشطة في جدول `Session` تابعة لمدير نظام برتبة `OWNER` أو `ADMIN` قبل توليد أي توكن جلسة احتياطية:
  ```typescript
  const sessionUser = await getAuthenticatedAdminUser(request);
  if (!sessionUser || sessionUser.role !== 'OWNER') {
    return NextResponse.json({ success: false, message: 'يتطلب صلاحيات مدير النظام' }, { status: 401 });
  }
  ```
- **الجهد:** متوسط (Medium).

---

### [SEC-003] كشف وتعديل وحذف بيانات المرضى والتحاليل والمالية عبر مسارات Fastify دون مصادقة 🔴 حرج (Critical)
- **الموقع:** `apps/server/src/routes/patients.ts:6`, `apps/server/src/routes/samples.ts:13,326,453,623`, `apps/server/src/routes/financials.ts:39`, `apps/server/src/routes/archive.ts:6`
- **المشكلة:**
  على الرغم من توفير مزين الأمان `fastify.authenticate`، فإن معظم مسارات الـ REST الأساسية في خادم Fastify مسجلة بدون أي فحص للمصادقة:
  - `GET /patients` و `GET /patients/search` (مكشوف بالكامل).
  - `GET /samples` و `POST /samples` و `PATCH /samples/:id/pay` و `DELETE /samples/:id` (مكشوف بالكامل).
  - `GET /financials/summary` (كشف كامل إيرادات وأرباح المختبر).
  - `GET /archive/results` (كشف كامل سجلات المرضى التاريخية).
  مقتطف من `apps/server/src/routes/samples.ts:623`:
  ```typescript
  fastify.delete('/samples/:id', async (request: any, reply: any) => {
    const { id } = request.params;
    // حذف العينة بدون أي onRequest: [fastify.authenticate]!
  ```
- **الأثر:**
  أي جهاز متصل بالشبكة المحلية للمختبر يمكنه التواصل مباشرة مع منفذ السيرفر وإجراء عمليات قراءة وتعديل وحذف شاملة لبيانات المرضى والعينات والمدفوعات المالية دون الحاجة إلى امتلاك اسم مستخدم أو كلمة مرور.
- **الحل المقترح:**
  إضافة `{ onRequest: [fastify.authenticate] }` لكافة المسارات الحساسة في `patients.ts` و `samples.ts` و `financials.ts` و `archive.ts`، وقصر الاستثناءات فقط على مسار تسجيل الدخول `auth/login` ومسار استلام نتائج الأجهزة المحمية بـ `apiKey`.
- **الجهد:** متوسط (Medium).

---

### [SEC-004] مفتاح الختم العتادي الثابت وإمكانية تزييف كاش الترخيص 🟠 عالٍ (High)
- **الموقع:** `apps/web/src/lib/licensing.ts:28-29` و `apps/web/src/lib/licensing.ts:105-111`
- **المشكلة:**
  على الرغم من ترقية التحقق من التراخيص إلى خوارزمية Ed25519، إلا أنه يتم استخدام مفتاح سري ثابت في الكود المصدري لختم ملف كاش الترخيص المحلي (`.hwid_seal.json`):
  ```typescript
  const HWID_NAMESPACE_SECRET =
    process.env.LABRYO_LICENSE_SECRET || 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';
  ```
  وتقوم دالة `loadPersistedHwidCache` باعتماد الـ HWID المخزن داخل الملف فوراً بمجرد مطابقة الختم المحسوب بالمفتاح الثابت، دون التحقق من أن `rawId` يطابق الجهاز الحالي:
  ```typescript
  const expectedSeal = crypto
    .createHmac('sha256', HWID_NAMESPACE_SECRET)
    .update(`${data.rawId}##${data.hwid}##${data.legacyHwid}`)
    .digest('hex');
  if (data.seal === expectedSeal) {
    return { rawId: data.rawId, hwid: data.hwid, legacyHwid: data.legacyHwid };
  }
  ```
- **الأثر:**
  يستطيع أي شخص اشترى ترخيصاً رسمياً لجهاز واحد أن ينسخ الترخيص إلى أجهزة أخرى، وبكتابة ملف `.hwid_seal.json` بسيط يحتوي على الـ HWID المرخص وختمه بالمفتاح الثابت المكشوف، يقبل البرنامج الترخيص على الأجهزة غير المرخصة.
- **الحل المقترح:**
  دمج بصمة عتادية مشتقة محلياً وغير قابلة للنقل في عملية الختم، وإلزام دالة التحميل بمقارنة `data.rawId` مع معرّف الجهاز الحقيقي `getRawMachineId()` قبل اعتماد الكاش:
  ```typescript
  const currentRaw = getRawMachineId();
  if (data.rawId !== currentRaw) {
    return null; // إلغاء الكاش إذا تم نقل الملف لجهاز آخر
  }
  ```
- **الجهد:** صغير (Small).

---

### [SEC-005] تشغيل أوامر Shell غير معقمة عبر cmd.exe في أتمتة واتساب 🟠 عالٍ (High)
- **الموقع:** `apps/desktop/main.js:1844-1860`
- **المشكلة:**
  عند فشل فتح بروتوكول واتساب المباشر، يستدعي كود سطح المكتب الأمر `cmd.exe /c start` مع رابط يحتوي على معاملات نصية مشتقة من بيانات التقرير دون تعقيم لمفسر الأوامر:
  ```javascript
  const targetUrl = 'whatsapp://send?phone=' + cleanPhone + (encodedText ? '&text=' + encodedText : '');
  ...
  execFile('cmd.exe', ['/c', 'start', '', targetUrl], { windowsHide: true }, (err) => ...)
  ```
  في موجه الأوامر `cmd.exe` بنظام ويندوز، يمثل المحرف `&` أداة فصل لتنفيذ أمر ثانٍ مستقل.
- **الأثر:**
  في حال احتواء النص على محارف خاصة أو علامات فصل أوامر بنظام ويندوز، قد يقوم `cmd.exe` بتنفيذ الأمر الملحق بصلاحيات التطبيق.
- **الحل المقترح:**
  إلغاء الاعتماد على `cmd.exe /c start` نهائياً، واستخدام `shell.openExternal` بشكل مباشر وآمن، أو تشغيل `explorer.exe` لمعالجة الرابط دون استدعاء مفسر الأوامر `cmd.exe`:
  ```javascript
  const { execFile } = require('child_process');
  execFile('explorer.exe', [targetUrl], { windowsHide: true }, (err) => ...);
  ```
- **الجهد:** صغير (Small).

---

### [SEC-006] تشغيل سكربت بصلاحيات غير مقيدة في المجلد المؤقت المشترك 🟠 عالٍ (High)
- **الموقع:** `apps/desktop/main.js:1779-1781` و `apps/desktop/main.js:1893-1896`
- **المشكلة:**
  يقوم التطبيق بنسخ سكربت `whatsappAutoPaste.ps1` إلى مسار ثابت داخل المجلد المؤقت للنظام `%TEMP%`:
  ```javascript
  const tempScript = path.join(require('os').tmpdir(), 'labryo-whatsappAutoPaste.ps1');
  fs.writeFileSync(tempScript, fs.readFileSync(found));
  ```
  ثم يتم تنفيذه عبر موجه PowerShell مع تجاوز صريح لسياسة التنفيذ (`-ExecutionPolicy Bypass`):
  ```javascript
  ['-STA', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', autoPasteScript]
  ```
- **الأثر:**
  مجلد `%TEMP%` في ويندوز متاح للكتابة من قِبل أي برنامج يعمل تحت نفس حساب المستخدم. استخدام اسم ثابت يمكن التنبؤ به يفتح المجال لهجمات استبدال السكربت (Race Condition / TOCTOU) لتنفيذ كود PowerShell تعسفي بصلاحيات التطبيق.
- **الحل المقترح:**
  توليد اسم عشوائي مشفر في كل مرة، أو الأفضل تشغيل السكربت مباشرة من مسار التثبيت المحمي في `app.asar.unpacked/services/whatsappAutoPaste.ps1` دون نسخه إلى المجلد المؤقت.
- **الجهد:** صغير (Small).

---

### [SEC-007] فتح الروابط عبر setWindowOpenHandler دون تقييد البروتوكول 🟡 متوسط (Medium)
- **الموقع:** `apps/desktop/main.js:1514-1517`
- **المشكلة:**
  معالج فتح النوافذ في Electron يمرر أي رابط خارجي إلى دالة `shell.openExternal` دون التأكد من أن البروتوكول مقتصر على `http:` أو `https:`:
  ```javascript
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  ```
- **الأثر:**
  إمكانية تشغيل بروتوكولات نظام خطيرة (مثل `file://`، `ms-msdt:`, `smb://`) في حال تم فتح نافذة منبثقة برابط غير آمن.
- **الحل المقترح:**
  التحقق من الرابط عبر `new URL(url)` وقصر الفتح على البروتوكولات الآمنة فقط:
  ```javascript
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        shell.openExternal(parsed.href);
      }
    } catch {}
    return { action: 'deny' };
  });
  ```
- **الجهد:** صغير (Small).

---

### [SEC-008] غياب تقييد معدل الطلبات (Rate Limiting) على مسار تسجيل الدخول 🟡 متوسط (Medium)
- **الموقع:** `apps/server/src/routes/auth.ts:12-49`
- **المشكلة:**
  نقطة النهاية `POST /auth/login` لا تطبق أي حد لمعدل الطلبات (Rate Limiting) أو حظر مؤقت للحسابات بعد تكرار محاولات الدخول الخاطئة.
- **الأثر:**
  إمكانية شن هجمات تخمين كلمات المرور (Brute-Force & Dictionary Attacks) ضد حسابات الموظفين ومدير المختبر بسرعة عالية عبر الشبكة المحلية.
- **الحل المقترح:**
  تسجيل حزمة `@fastify/rate-limit` على مسار تسجيل الدخول للحد من المحاولات (مثلاً 5 محاولات لكل دقيقة لكل IP).
- **الجهد:** صغير (Small).

---

## 📊 نطاق التغطية المثبتة (Inspection Scope)

- **الملفات والمجلدات التي تم فحصها فعلياً:**
  - كافة ملفات المصادقة والتراخيص: `apps/web/src/lib/licensing.ts`، `apps/server/src/utils/licensing.ts`، `apps/web/src/middleware.ts`، `apps/server/src/routes/auth.ts`.
  - كافة ملفات النسخ الاحتياطي: `apps/web/src/lib/backupSecurity.ts`، `apps/web/src/lib/backupAuth.ts`، `apps/web/src/lib/backupTokenUtils.ts`، `apps/web/src/app/api/backup/*`، `apps/server/src/routes/backup.ts`.
  - مسارات البيانات والـ API: `apps/server/src/routes/*.ts` (19 مساراً بالكامل)، `apps/server/src/index.ts`، `apps/server/src/services/deviceEngine.ts`، `apps/web/src/lib/serverStore.ts`.
  - إعدادات وأمان غلاف Electron المكتبي: `apps/desktop/main.js`، `apps/desktop/preload.js`.
  - اختبارات الأمان الآلية: `tests/security/*.ts` (3 حزم اختبارات كاملة تم تشغيلها بنجاح).
- **ما لم يتم فحصه والسبب:**
  - ملف `.env` الداخلي: مستبعد حمايةً للأسرار وللقواعد الصارمة المحددة.
  - الحزم الخارجية في `node_modules`: تم فحص النسخ المسجلة في `package-lock.json` دون فحص الأكواد الداخلية للمكتبات الخارجية.