# نشر النظام على خادم كايزن

هذا الدليل يثبت التطبيق في `/opt/makkah-event`، قاعدة MariaDB مستقلة في حاوية Docker، وNext.js على `127.0.0.1:3001`. إعداد كايزن الحالي على المنفذ `3000` وMongoDB على `27017` لا يتغيران. نفّذ الأوامر على الخادم بصلاحية root بعد رفع التحديث إلى GitHub.

## 1. المتطلبات ونسخة التطبيق

تحقق أولًا من Docker Compose؛ لا يظهر Docker ضمن جرد الخادم السابق:

```bash
node -v
npm -v
docker compose version
pm2 ls
```

يحتاج المشروع Node.js `20.19+` وDocker Compose. إذا لم يتوفر Docker، ثبّت Docker Engine وCompose من مستودع Docker الرسمي قبل المتابعة. لا تثبّت SQL على المنفذ العام؛ Compose يربط MariaDB على loopback فقط.

```bash
install -d -m 0755 /opt/makkah-event
git clone --branch main https://github.com/moghalisprogrammer-dotcom/Makkah-To-The-World.git /opt/makkah-event/app
cd /opt/makkah-event/app
npm ci
```

إذا كان `/opt/makkah-event/app` موجودًا، لا تكرر `git clone`؛ حدّثه يدويًا بعد أخذ نسخة احتياطية من ملف البيئة.

## 2. إعداد الأسرار وقاعدة البيانات

```bash
cd /opt/makkah-event/app
umask 077
cp .env.example .env.production.local
nano .env.production.local
chmod 600 .env.production.local
```

املأ القيم التالية، ولا تضع علامات اقتباس حول كلمات المرور:

```dotenv
DATABASE_URL=mysql://makkah:ضع_كلمة_مرور_SQL@127.0.0.1:3307/makkah_event
MYSQL_ROOT_PASSWORD=كلمة_مرور_جذر_SQL_عشوائية_جديدة
MYSQL_PASSWORD=ضع_نفس_كلمة_مرور_SQL_هنا
APP_URL=https://makkah.kaizenksa.com
EVENT_CAPACITY=800
SESSION_HOURS=12
TRUST_PROXY=true
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_مفتاحك_السري
EMAIL_FROM="Kaizen Events <events@kaizenksa.com>"
ADMIN_PASSWORD=كلمة_مرور_عشوائية_طويلة_ومختلفة
STAFF_1_PASSWORD=كلمة_مرور_مختلفة_للبوابة_1
STAFF_2_PASSWORD=كلمة_مرور_مختلفة_للبوابة_2
STAFF_3_PASSWORD=كلمة_مرور_مختلفة_للبوابة_3
STAFF_4_PASSWORD=كلمة_مرور_مختلفة_للبوابة_4
```

أنشئ كلمات مرور فريدة لا تقل عن 16 حرفًا، مثل ناتج `openssl rand -hex 24`. يجب أن تتطابق كلمة مرور `MYSQL_PASSWORD` مع كلمة المرور داخل `DATABASE_URL`. يقرأ Docker Compose وNext.js هذا الملف، لذلك لا ترفعه للمستودع ولا ترسله في محادثة. احتفظ بحسابات الدخول في مدير كلمات مرور.

في Resend، وثّق نطاق الإرسال بإضافة سجلات SPF/DKIM التي يعرضها حسابك إلى DNS. استخدم عنوان `EMAIL_FROM` تابعًا للنطاق الذي وثقته؛ لا تستخدم `mnc.edu.sa` إلا إذا كانت الجهة تملك صلاحية توثيقه. لا نحتاج مفتاح SMTP؛ الإرسال يتم بمفتاح Resend API من الخادم فقط.

```bash
docker compose --env-file .env.production.local up -d db
docker compose ps
npm run db:setup:prod
npm run typecheck
npm run build
```

يهيئ الإعداد جداول الحدث وينشئ الحسابات `admin`, `staff1`, `staff2`, `staff3`, `staff4`. كلمات المرور هي التي أدخلتها في الملف؛ يعرض دور الموظف رقم بوابته بعد تسجيل الدخول.

## 3. تشغيل التطبيق

```bash
pm2 start npm --name makkah-event -- start
pm2 save
curl -fsS http://127.0.0.1:3001/api/health
```

يستمع Next.js على `127.0.0.1:3001` فقط، ولا يفتح منفذًا عامًا. إذا لم يكن PM2 مضبوطًا للتشغيل بعد إعادة تشغيل الخادم، شغّل `pm2 startup` واتبع الأمر الذي يطبعه مرة واحدة.

## 4. ربط النطاق في Nginx

بعد إنشاء `makkah.kaizenksa.com` في DNS، أنشئ ملفًا مستقلًا:

```bash
cat > /etc/nginx/sites-available/makkah-event <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name makkah.kaizenksa.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
NGINX
ln -s /etc/nginx/sites-available/makkah-event /etc/nginx/sites-enabled/makkah-event
nginx -t && systemctl reload nginx
```

بعد أن يشير DNS إلى الخادم ويصبح النطاق قابلًا للوصول، فعّل TLS بشهادة Let’s Encrypt (إذا كان Certbot مثبتًا):

```bash
certbot --nginx -d makkah.kaizenksa.com
```

لا تغيّر ملف موقع `kaizenksa.com` ولا `default`؛ هذا الموقع يستخدم إعدادًا منفصلًا.

## 5. تحقق تشغيلي قبل فتح التسجيل

- افتح `/api/health` وتأكد من استجابة `ok`.
- سجّل زائرًا بعنوان بريد تملكه، وتحقق من وصول QR والبرنامج ورابط الكلية ومرفق التقويم.
- افتح الرابط الخاص بالتذكرة وامسح QR من هاتفين مختلفين، ثم جرّب نفس الرمز مرة ثانية؛ يجب رفض تسجيل دخول مكرر.
- سجّل دخول المدير وموظف كل بوابة، وتأكد من الفلاتر والتصدير وسجل الحضور.
- اختبر النسخ الاحتياطي والاستعادة قبل استقبال بيانات حقيقية.

اختبارات التكامل على قاعدة الإنتاج غير مسموحة؛ فهي تنشئ وتحذف سجلات تجريبية وتغير حد السعة مؤقتًا. اختبر محليًا أولًا باستخدام Mailpit.

## النسخ الاحتياطي والصيانة

```bash
docker compose --env-file .env.production.local exec -T db sh -c 'mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" makkah_event' > /root/makkah-event-$(date +%F).sql
chmod 600 /root/makkah-event-*.sql
```

شفّر نسخة قاعدة البيانات وانقلها إلى مخزن نسخ احتياطية منفصل؛ ملف SQL الخام يحتوي بيانات شخصية. لا تترك النسخة الوحيدة على الخادم نفسه.
