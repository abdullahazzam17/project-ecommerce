@echo off
title Frontend Zoom Custom (Web - port 3000)
cd /d "%~dp0frontend"
echo ============================================
echo  MENJALANKAN FRONTEND (WEB) ZOOM CUSTOM
echo  Buka di browser: http://localhost:3000
echo  Dari HP         : http://192.168.0.1:3000
echo  JANGAN TUTUP JENDELA INI selama demo!
echo ============================================
npm run dev
pause
