# Souvenirs: lokaler Abschlusscheck

Stand: 22.10.2026. **Lokal geprüft, nicht auf Production veröffentlicht.** Aktuelle Regeln und offene Erweiterungen: [Souvenir.md](../Souvenir.md).

## Ergebnis

Keine offenen Funktionsfehler im geprüften Umfang. 179 isolierte Integrationstests und 32 Frontendtests erfolgreich. 34 JavaScript-Dateien sowie alle PHP-Dateien unter `src/backend` und `api` syntaktisch geprüft. CSS-Build, Token- und BEM-Prüfung erfolgreich; lokaler Hostinger-Build erstellt.

## Geprüfter Umfang

| Bereich | Prüfung / Ergebnis |
|---|---|
| Datenbank | Leere Datenbank, Schema-Snapshot, kompletter Migrationslauf 001–019 und Wiederholung erfolgreich; keine doppelten Seeds, Amalfi-Adminänderungen bleiben erhalten. |
| Vergabe | Reisestempel nach belegter Antwort/Kategorienbesuch; Entdecker nur unterschiedliche richtige Erst-/Zweitversuche; falsch/übersprungen ohne Fortschritt. Schwellen 5/20, Wiederholungen, spätere richtige Lösung und eingefrorene Kategorie geprüft. |
| Bestand / Schutz | Belegbarer Backfill, unveränderte Altvergaben, Archivierung, Nutzertrennung, CSRF, verlorene Speicherantwort/Retry, Reset und Kontolöschung geprüft. |
| Profilbilder | Hero-Erstversuch, dauerhafte Auswahlberechtigung, unerlaubte Auswahl, Aktivierung/Deaktivierung/Löschung, Standardheld-Fallback und Seed-Bestandsschutz automatisiert geprüft. |
| Admin / Medien | Definitionsrevisionen, Entwürfe, Aktivierung, Zielvalidierung, Medienzuordnung und Schutz verwendeter Motive geprüft. |
| Sammlung im Browser | Gast ohne persönliche Karten; leerer Zustand ohne unbegonnene Ziele; Vorschau mit allen vier Städten und acht Karten. Stempel links/Marke rechts bei 1440 Pixeln, untereinander bei 390 Pixeln. Alle acht Motive geladen; offene Marken mit zentralem Sepia-Filter und grauem Hintergrund, fertige Marken ohne Filter. Balken 5/20 und 5/5 korrekt. Stempeldialog öffnet ohne unnötigen Spiel-Link. Keine Nutzerfilter oder Profilbildkarten und kein horizontaler Überlauf. |
| Konto / Registrierung | Vorherige gezielte Browserprüfungen: benannte Heldenkarten, lila Auswahl, Hash-Einstieg, automatische Speicherung mit gesperrten Folgeaktionen, aktualisiertes Profil-/Headerbild und Rückkehr zur bisherigen Auswahl nach simuliertem Fehler. Registrierung übernimmt die Wahl erst beim Absenden. Nach CSS-Bereinigung beide Ansichten erneut kontrolliert: 26 freie Karten, lila Auswahl, kein alter Dialog/Speicherbutton im Konto und kein horizontaler Überlauf. |

Die Browser-Sammlungsprüfung verwendet ausschließlich temporäre Darstellungsdaten. Die Backendtests laufen in einer separaten `quiz_hero_audit_*`-Datenbank, die danach entfernt wurde. Kein Reset oder künstliche Vergabe am echten lokalen Nutzer. Browserprüfungen sind DOM-/Layoutprüfungen; keine vollständige Screenshot-Abnahme behauptet.

## Bereinigung

- Unbenutzte CSS-Regeln des entfernten Profilbild-Dialogs und der früheren kompakten Auswahl entfernt; aktuelle Konto-/Registrierungskarten erhalten.
- Widersprüchliche Souvenirbeschreibungen in `FEATURES.md` und `docs/QUIZ-REISEPASS.md` durch den aktuellen Stand ersetzt. Historische Details bleiben im gekennzeichneten Archiv.
- Migrationsanforderungen auf 014–019 aktualisiert. Keine neuen fachlichen Regeln oder zusätzlichen Features im Abschlusscheck eingeführt.

## Production-Vorprüfung und nächster Schritt

Öffentliche API am 22.10.2026 ausschließlich lesend geprüft: HTTP 200. Rom 72, Neapel 8, Florenz 126 und Amalfi 27 Fragen; alle vier Kategorien aktiviert. Die Zielwerte 20/5/20/20 sind damit im aktuellen öffentlichen Bestand erreichbar. Inaktive Fragen und private Produktionsdaten wurden dabei nicht gelesen.

Der lokale Build nutzt ausdrücklich die lokale JSON-Quelle für SEO und ist eine Buildprüfung, kein fertiger Production-Inhaltsabgleich. Vor Veröffentlichung frisches Datenbank-/Uploadbackup, tatsächlichen Migrationsstand prüfen, ausstehende Migrationen bis 019 anwenden und über den vorhandenen Deploymentprozess aktivieren. Anschließend Production-Smokecheck. Wiederherstellungsgrenzen stehen in `Souvenir.md` und den bestehenden Betriebsdokumenten.
