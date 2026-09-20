module.exports = {
  apps: [
    {
      name: 'lab-backend-server',
      cwd: './apps/server',
      script: 'dist/index.js',
      instances: 1, // نواة واحدة للحفاظ على جلسة واستقبال أجهزة التحليل الطبية ASTM/TCP دون تعارض المنافذ
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    },
    {
      name: 'lab-web-app',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 8080',
      instances: 'max', // تشغيل نمط العنقود (Cluster Mode) لواجهة الويب وقوالب التحاليل
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 15000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      }
    }
  ]
};
