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

Codeaktivierung und abschließende Liveprüfungen stehen noch aus. Nach Erfolg werden Release-ID, Commit und Bildnachweise hier ergänzt.
