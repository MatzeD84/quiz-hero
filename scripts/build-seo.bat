@echo off
setlocal

if "%~1"=="" (
  echo SITE_URL nicht gesetzt, sitemap.xml/robots.txt werden nicht erstellt.
) else (
  set SITE_URL=%~1
  echo SITE_URL gesetzt auf %SITE_URL%
)

node scripts\build-seo-pages.js
endlocal
