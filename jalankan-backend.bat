@echo off
title Backend Zoom Custom (API - port 8000)
cd /d "%~dp0backend"
echo ============================================
echo  MENJALANKAN BACKEND (API) ZOOM CUSTOM
echo  Alamat: http://192.168.0.1:8000
echo  JANGAN TUTUP JENDELA INI selama demo!
echo ============================================
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0
pause
