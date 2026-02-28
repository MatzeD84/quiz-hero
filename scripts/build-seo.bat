@echo off
setlocal
set "HAS_SITE_URL=0"

if "%~1"=="" (
  echo [!] [WARN] SITE_URL nicht gesetzt, sitemap.xml/robots.txt werden nicht erstellt.
) else (
  set "SITE_URL=%~1"
  set "HAS_SITE_URL=1"
  echo [v] [OK] SITE_URL gesetzt auf %SITE_URL%
)

echo [INFO] Starte SEO-Build...
node scripts\build-seo-pages.js
if errorlevel 1 (
  echo [x] [ERROR] SEO-Build fehlgeschlagen.
  endlocal
  exit /b 1
)

if exist "pages\index.html" (
  echo [v] [OK] SEO-Landingpages in /pages erfolgreich generiert.
) else (
  echo [!] [WARN] Build lief, aber pages\index.html wurde nicht gefunden.
)

if "%HAS_SITE_URL%"=="0" (
  echo [!] [WARN] SITE_URL fehlt. sitemap.xml und robots.txt wurden nicht erzeugt.
) else (
  if exist "sitemap.xml" (
    echo [v] [OK] sitemap.xml erfolgreich erstellt.
  ) else (
    echo [!] [WARN] sitemap.xml wurde nicht erzeugt.
  )
  if exist "robots.txt" (
    echo [v] [OK] robots.txt erfolgreich erstellt.
  ) else (
    echo [!] [WARN] robots.txt wurde nicht erzeugt.
  )
)

echo [v] [OK] SEO-Build abgeschlossen.
endlocal
