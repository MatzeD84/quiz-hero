# Helden-Rollout vom 31.10.2026

## Freigabe und Vorbereitung

Der Nutzer hat den gesamten aktuellen Featurestand samt lokalen Helden-/Belohnungs-Testkonfigurationen ausdrücklich für Production freigegeben. Ziel ist ausschließlich **https://quiz-hero.de**, technischer Hostinger-Pfad weiterhin `quiz-hero-stage.matzeverse.de` (kein getrenntes Staging).

Ausgangsrelease: `d4d6af0000a0-20261023153242`, Migrationen bis 021. Vollständige Sicherung vor Änderungen: `private/backups/before-heroes-20261031201513/`, SQL-Dump, Konfiguration, Uploadarchiv und Manifest. Vorab gezählt: 6 Kategorien, 297 Fragen, 5 Accounts, 11 Ergebnisse.

Geprüft: 57 Frontendtests, 301 isolierte Integrationstests, CSS-/Token-/BEM-Build, PHP-Syntax und vollständiger Produktionsbuild mit lesendem SEO-Export aus der Produktionsdatenbank. Lokale Tests importieren keine Konten oder Ergebnisse nach Production.

## Umfang

- Heldenfähigkeiten mit fünf implementierten Effekten, persönlichen Freischaltungen, einmaligem Einsatz je Fähigkeit/Runde, illustrierten Lernerfolgen und Startfähigkeiten bei 0 Runden.
- Belohnungsbaukasten für freigeschaltete Helden mit Gesamtfortschritt/Einzelrunde, unterschiedlichen richtigen Fragen und historischen Vergabegründen.
- Heldenverwaltung, Bildverwaltung, Konto-/Registrierungsvorschau, kompakte Fähigkeitsanzeigen, Speichern nur bei Änderungen, Schließen nach Erfolg und gemeinsame Statusanzeige.
- Dokumentation unter `docs/` zusammengeführt. Frühere lokale Prüfnotizen bleiben als zeitlich datierte Vorabstände erkennbar; das tatsächliche Deployment wird hier und im Production-Protokoll festgehalten.

## Gezielt übernommene Datenbankkonfiguration

Keine Wiederherstellung der lokalen Datenbank und kein Import von Fragen, Testkonten, Ergebnissen, persönlichen Freischaltungen oder Rundensnapshots. Übernommen werden ausschließlich Katalog-/Regeldaten in `quiz_avatars`, `quiz_abilities`, `quiz_hero_abilities`, `quiz_avatar_reward_rules`. Lokale gelöschte Testduplikate werden nicht angelegt. Produktionsfremde Katalogeinträge werden nicht gelöscht. Beim Abgleich werden bestehende Katalogrevisionen auf zwischenzeitliche Änderungen geprüft.

| Belohnungsheld | Bedingung |
|---|---|
| Akuma | 2 unterschiedliche Hero-Fragen insgesamt, erster Versuch, ohne Hilfe |
| Amphos | 5 unterschiedliche richtige Fragen insgesamt, beide Versuche, Hilfe erlaubt |
| Cassius | 3 unterschiedliche richtige Fragen in einer Questrunde, ohne Hilfe |
| Horus | 5 unterschiedliche richtige Rom-Fragen insgesamt, ohne Hilfe |
| Astra | Bestehende feste Hero-Erstversuchsregel bleibt erhalten; Baukastenvorlage ebenfalls vorhanden |

Winterseherin bleibt gemäß lokalem Stand als Belohnung markiert, ohne aktive Vergaberegel. Anubia und Goldzahn werden gemäß lokaler Einstellung deaktiviert. Betroffene aktuell ausgewählte, nicht mehr verfügbare Helden erhalten den bestehenden Standardheld-Fallback; persönliche Berechtigungen werden dabei nicht gelöscht und keine Belohnungen künstlich vergeben.

Fähigkeitsschwellen: Heldenblick 0 (Startfähigkeit), Neues Abenteuer 1, Schutzschild 1, Scharfblick 3, Glücksanker 3 Runden. Alle lokalen Zuordnungen innerhalb maximal drei Fähigkeiten je Held werden übernommen. Die fünf versionierten Fähigkeits-PNGs unter `public/images/abilities/` werden mit dem Code ausgeliefert; vorhandene Avatar-/Souvenirbilder und gemeinsame Uploads bleiben erhalten.

## Migration und Rücksprung

Migrationen 022–027 werden nach Backup ausdrücklich separat angewendet, anschließend die gezielte Konfiguration in einer Transaktion. Der Git-/Cronworker aktiviert nur ein Release mit vollständig vorhandenem Migrationsstand. Eine Dateirückkehr auf Code vor 022 kennt die neuen Fähigkeits-/Belohnungsregeln nicht und stellt weder Katalog noch Fortschritt zurück. Bevorzugt vorwärts korrigieren; ein Datenbankrestore würde seit der Sicherung hinzugekommenen Fortschritt verlieren und muss separat abgewogen werden.

## Veröffentlichungsnachweis

Migrationen 022–027 und die freigegebene Konfiguration sind auf Production angewendet: 27 nicht gelöschte Helden, fünf Fähigkeiten, fünf Belohnungsdefinitionen. Ein nicht mehr zulässiges ausgewähltes Profil wurde auf den Standardhelden umgestellt; keine Berechtigung gelöscht. Kategorien, Fragen und Quizwelt-Verknüpfungen per Hash unverändert; 6 Kategorien, 297 Fragen, 5 Konten, 11 Ergebnisse und 0 persönliche Avatarvergaben vor/nach Abgleich unverändert. Keine lokalen Testduplikate angelegt.

Beim privaten Vorbereitungsarchiv wurden Windows-Verzeichnisrechte korrigiert und eine auf Shared Hosting nicht verfügbare Prozesssubstitution durch eine normale Listendatei ersetzt. Diese beiden abgebrochenen Anläufe erfolgten vor dem Start der Migrationen. Der anschließende vollständige Lauf war erfolgreich.

**Erfolgreich veröffentlicht:** Release `97ff6254492f-20261031202004`, Commit `97ff6254492f3666554c25e726f89659eb6b1e12`. Aktiviert am 31.10.2026; maßgeblich bleibt die aktuelle `/version.json`. Vorheriges Release `d4d6af0000a0-20261023153242` ist erhalten. Die eingangs datierten lokalen Prüfnotizen in den Fachdokumenten sind Vorabstände; die hier aufgeführten Features sind nun auf Production.

- Serverbuild: 57 Frontendtests, vollständiges PHP-Lint, fünf SEO-Seiten aus dem Liveexport, CSS, versionierte Assets, CSP, Migrationsprüfung und atomare Aktivierung erfolgreich. HTTPS-Freigabe des Workers erfolgreich.
- Direkter aktiver Servercheck: 31 Avatar-/Fähigkeitsbilder stimmen per SHA-256 mit dem Projekt überein. Fünf Fähigkeiten, fünf Belohnungsdefinitionen, alle 27 nicht gelöschten Helden und ihre Zuordnungen entsprechen der freigegebenen Konfiguration. Keine sichtbaren Testduplikate und kein erlaubter Production-Testreset.
- HTTPS: Startseite, Admin, Konto, Login, Reisepass, Souvenirs, Versionsdatei und öffentliche Daten-API HTTP 200. Alle fünf Fähigkeits-PNGs als gültige PNGs mit `image/png` erreichbar. CDN-Bytes können durch Bildoptimierung von den Originalen abweichen; Bytegleichheit wurde serverseitig nachgewiesen.
- Öffentliche Profilwahl enthält 19 freie aktive Helden; deaktivierte und Belohnungshelden sind ausgeblendet. Registrierungsvorschau liefert nur Startfähigkeiten mit Ziel 0. Mobiler Produktionsbrowser (390 Pixel): Quiz-Hero/Burgo nur mit Heldenblick, Bobo ohne gesperrte Fähigkeiten, korrekter Leerhinweis, einheitliches Schließen-X und kein horizontaler Überlauf. „Lokal testen“ bleibt unsichtbar. Kein Account registriert, keine Productionrunde oder künstliche Vergabe zur Prüfung gespeichert.
- Nach allen Änderungen weiter 6 Kategorien, 297 Fragen, 5 Konten, 11 Ergebnisse und 0 persönliche Avatarvergaben. Geschützte Inhalts-Hashes vor/nach Konfigurationsübertragung identisch. Lokale isolierte Audit-Datenbank nach Abschluss entfernt.

Nachträgliche Dokumentationspflege auf `master` verändert den hier genannten veröffentlichten Code-Commit auf `hostinger` nicht.
