# Hostinger production

Production URL: https://quiz-hero.de. Hostinger Git deployment remains on branch `hostinger`. The adopted application design is developed on `master`; publishing it requires a reviewed merge into `hostinger`.

## Quizdarstellung und CSS-Pflege – Folgerelease 22.10.2026

Release **`cb23f51a0cc4-20261022131903`**, Commit `cb23f51a0cc4df6ee9f179cb1d3bc4d4d3fd8df3`, erfolgreich aktiviert. Maßgeblich für den jeweils aktiven Stand bleibt `/version.json`.

- Veröffentlicht: Schwierigkeitstags und Punkte vor den Antworten, zweiter Versuch mit 1-Punkt-Hinweis, reiner Fragenzähler im Header, passende Hoverfarben, modulare CSS-Struktur und eindeutige zentrale Tokens. Siena-Bild als vorbereitete Datei enthalten; keine Kategorie angelegt.
- Backup: `private/backups/before-souvenirs-20261022131540/`, einschließlich SQL-Dump, Konfiguration, Uploads und Manifest. Vorheriges Dateirelease `8b84553884fa-20261022101348` bleibt für Rücksprung erhalten.
- Keine Migration oder Datenänderung nötig; Schema bleibt bis 019. Bestehende Fragen, Accounts, Fortschritte und Uploads wurden nicht importiert oder zurückgesetzt.
- Lokal: 34 Frontendtests, CSS-/BEM-Prüfung, Build und 24 Browserkombinationen erfolgreich. Server: Vertragstests, PHP-Lint, SEO-Export aus der Produktionsdatenbank, Release-/Migrationsprüfung und HTTPS-Prüfung erfolgreich.
- Live: Startseite, Konto, Login, Admin, Reisepass, Souvenirs und öffentliche API HTTP 200; CSS-/JS-Änderungen sowie Release-Cacheversionen bestätigt. Tag/Punkte/Zähler und Bildposition im Produktionsbrowser ohne Speichern einer Runde geprüft.
- Siena-Original auf dem Server hat denselben SHA-256 wie lokal: `4b82bc607e27188599f881c9c9197a63ffb141c5f200022f433c0a6581478a45`. Die über Hostingers CDN gelieferte PNG ist byteweise anders (`26966b08b0110a9faf52b5f121f98859cf6e2378c417f84b440de6b037c87455`), plausibel durch Bildoptimierung. HTTP 200, PNG-Format, 1536 × 1024 Pixel und das korrekte menschenleere vereinfachte Motiv wurden separat geprüft; kein bytegleicher HTTPS-Transport behauptet.

Details und Prüfgrenzen: [Abschlussprüfung](QUIZ-ABSCHLUSSPRUEFUNG-2026-10-22.md). Nachträgliche reine Dokumentationspflege auf `master` verändert den aktiven Code-Commit auf `hostinger` nicht.

## Souvenirs und Heldenbelohnungen – vorheriger Rollout am 22.10.2026

Basisrelease `aec5d3a61f20-20261022100902`, Commit `aec5d3a61f209eae347bd08c6e2108e7ad139c44`, erfolgreich aktiviert und per HTTPS geprüft. Ein anschließendes Folgerelease ergänzt die Cacheversionierung von `reisepass.html` und `souvenirs.html`; dafür gibt es einen gezielten Regressionstest. Der tatsächlich aktive Commit und die Release-ID stehen immer unter `/version.json`.

- Vorabbackup: `private/backups/before-souvenirs-20261022100619/` mit vollständigem SQL-Dump, privater Konfiguration, Uploadarchiv und SHA-256-Manifest. Vorheriges Dateirelease bleibt erhalten. Keine Sicherungsdateien im Webroot.
- Migrationen **014–019** vor Codeaktivierung ausdrücklich angewendet. Acht aktive Souvenirdefinitionen für Rom, Neapel, Florenz und Amalfi-Küste; Avatar-Katalog mit 27 Einträgen einschließlich Astra. Bestandszahlen vor/nach Migration unverändert. Keine lokalen Fragen oder Accounts nach Production importiert.
- Alle acht Souvenir-PNGs und Astra im Release enthalten, serverseitig per SHA-256 gegen die lokalen Originale abgeglichen und öffentlich mit HTTP 200 / `image/png` geprüft. Gemeinsame bestehende Uploads bleiben erhalten.
- Deployment lief über Hostinger-Gitbranch und Cronworker, einschließlich serverseitiger Frontendtests, PHP-Lint, SEO-Export aus der Produktionsdatenbank, Migrationsprüfung und atomarer Aktivierung.
- Livecheck: Startseite, öffentliche API, Konto, Login, Admin und beide privaten Seiten erreichbar; alte Adresse `passport.html` leitet mit Queryparametern auf `reisepass.html`. Gastansicht zeigt keine persönliche Sammlung. Test-Reset bleibt auf Production gesperrt.
- Kein künstlicher Spielabschluss, Reset oder Belohnungs-Backfill an echten Productionaccounts für die Prüfung ausgeführt. Persönliche Vergaben erfolgen regulär bei Rundenabschluss beziehungsweise geschütztem Abgleich.

Beim vorbereitenden privaten Migrationspaket fehlten zunächst Bootstrap-Abhängigkeiten; der Start scheiterte vor jeder Migration. Vollständige Abhängigkeiten und passende Arbeitsverzeichnisrechte ergänzen, danach lief 014–019 erfolgreich. Für spätere Migrationen immer den vollständigen Quellstand außerhalb des Webroots mit privatem Konfigurationsverweis bereitstellen, nicht nur `migrate.php` und `bootstrap.php`. Windows-Tararchive mit `--no-same-owner --no-same-permissions --no-overwrite-dir` in ein zuvor schreibbares privates Arbeitsverzeichnis entpacken. Zugangsdateien und Dumps nicht ausgeben.

Ein Rücksprung auf Code vor 017/018 berücksichtigt Aktivierung/Löschmarkierungen und neue Profilbilder nicht vollständig. Bei Problemen bevorzugt vorwärts korrigieren beziehungsweise konsistent aus Backup wiederherstellen; ein Dateirücksprung allein setzt Datenbank und neu vergebenen Fortschritt nicht zurück. Details der Regeln: [Souvenir.md](../Souvenir.md); lokale Vorabprüfung: [Prüfbericht](SOUVENIRS-ABSCHLUSSPRUEFUNG.md).

The existing website root `/home/u199598707/domains/quiz-hero-stage.matzeverse.de` is retained intentionally: `quiz-hero.de` is its Hostinger alias. Both names share the same release, uploads and database. This is not an isolated staging environment. The former staging hostname redirects to production; create a separate database and website before using it for development again.

`deployment/hostinger.json` controls the build origin and environment. Production builds require `ALLOW_PRODUCTION_BUILD=true`; the Hostinger build hook sets this only after validating the reviewed production target. Set the private server configuration's `SITE_URL` to the same origin. Credentials remain outside Git.

Source deployment never imports quiz JSON or restores a database. Questions, accounts and uploaded media remain in the existing database and shared uploads. The content worker generates SEO pages from the live database separately.

Mail: `info@quiz-hero.de` is the intended mailbox. DNS contains Hostinger MX, SPF, DKIM and DMARC. Website transactional mail additionally requires server-side SMTP configuration; mailbox existence alone does not configure the application. Never commit SMTP passwords.

Validation: production build, contract tests, PHP lint, HTTPS release/API checks, canonical URLs, redirects and sitemap. Before rollout back up the private runtime configuration and take a database backup; keep the previous release available for rollback.

Release vom 18. Oktober 2026 nach dem Reisepass: kompaktere Quizansicht, klarere Profil-/Anmeldeablaeufe und Adminverbesserungen mit Tag-Chips, automatischen Kategorie-IDs sowie zentralem Bildaustausch. Keine neuen Migrationen; Schema bis 013 bleibt bestehen. Vorab 100 isolierte Integrationstests, 28 Vertragstests, PHP-Lint, CSS-/BEM-Pruefung und Produktionsbuild erfolgreich. Sicherung vor dem Rollout: `private/backups/before-design-20261018211030/` (Datenbank und private Konfiguration). Details zum Bildaustausch: [Mediathek](MEDIA.md).

During the initial DNS migration only, the worker can be run with `QUIZ_HERO_VERIFY_IP=46.202.158.83` to verify the Hostinger origin despite stale recursive DNS caches. TLS verification stays enabled. This variable is not stored in cron; subsequent automatic deployments verify public DNS normally.
