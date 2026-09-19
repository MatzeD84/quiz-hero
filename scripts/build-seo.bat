@echo off
setlocal
set "SEO_SOURCE=json"
set "SITE_URL=http://localhost:8080"
if not "%~1"=="" set "SITE_URL=%~1"
echo [INFO] Lokale JSON-Vorschau. Ausgabe: .build/seo. Kein Produktionsdeploy.
node scripts/build-seo-pages.js
if errorlevel 1 exit /b 1
echo [OK] SEO-Vorschau erstellt. Produktion verwendet ausschliesslich den API-Export.
endlocal
