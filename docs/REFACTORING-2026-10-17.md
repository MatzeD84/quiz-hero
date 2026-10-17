# Refactoring am 17.10.2026

## Verhalten und Architektur

Das Frontend beh?lt HTML-Struktur, Styles, Bilddateien und Quizregeln. Korrigiert werden Fokus?berg?nge, die Pr?fung der Fragenanzahl und unzul?ssiges Weiterklicken. Browser-Speicher darf blockiert sein: Die Sitzung wird unabh?ngig vom lokalen Profilcache per Cookie gepr?ft.

?ffentliche Dateien liegen unter public/. Backend, Datenbankwerkzeuge und Secrets liegen au?erhalb dieser HTTP-Wurzel. Backendfunktionen sind nach Accounts, Content, Quiz, Administration, Mailtransport und Vorlagen aufgeteilt. Kleine API-Kompatibilit?tseinstiege bleiben erhalten; keine neue Frameworkabh?ngigkeit.

## Quiz und Accounts

Migration 009_quiz_rounds.sql erg?nzt eine separate Tabelle. Eine angemeldete Runde friert die aktiven Fragen in ihrer urspr?nglichen Reihenfolge ein; danach auftretende redaktionelle ?nderungen ?ndern diese Runde nicht. Beim Abschluss validiert der Server Fragenreihenfolge, Antwortindices und maximal zwei verschiedene Versuche. Er berechnet Punkte selbst. Wiederholte identische ?bertragungen sind idempotent; abweichende Wiederholungen erhalten HTTP 409. Neue Runden verfallen nach 24 Stunden. Leere Antworten vergeben null Punkte und erlauben weiterhin das ?berspringen nicht ladbarer Bilder. Gastspiele ben?tigen keine Speicherung.

Neue Accountpassw?rter verwenden Argon2id, wenn verf?gbar, sonst bcrypt mit ausdr?cklich gepr?fter 72-Byte-Grenze. Bestehende Hashes bleiben kompatibel. Adminsitzungen laufen nach 30 Minuten Inaktivit?t oder sp?testens acht Stunden ab. Fehler im Rate-Limit-Speicher f?hren zu HTTP 503 statt unbegrenzten Anmeldeversuchen.

## Gleichzeitige Bearbeitung

Fragen und Kategorien tragen einen serverseitig berechneten contentVersion-Wert. Speichern bestehender Eintr?ge erfordert diesen Wert. Unter einer Datenbank-Zeilensperre wird die Fassung erneut gepr?ft. Eine veraltete Bearbeitung erh?lt 409; Formulare bleiben erhalten. Neu laden und ?nderungen bewusst erneut ?bernehmen. Diese Sicherung gilt f?r Bearbeitungen; L?schungen behalten ihre vorhandenen Best?tigungen.

## Content-Ver?ffentlichung

Der minutenweise Hostinger-Worker pr?ft vor Git-Builds den aktuellen Datenbankexport. Ein unver?nderter Export wird ?bersprungen. ?nderungen erzeugen SEO-Seiten, Sitemap und passende CSP-Hashes unabh?ngig von einem Push. Immutable Code-/Bilddateien werden durch Hardlinks wiederverwendet; ge?nderte generierte Dateien erhalten neue Dateien. Nach Pr?fung wird der public_html-Symlink atomar umgeschaltet, bei fehlgeschlagener HTTP-Pr?fung zur?ckgesetzt. Authschutz und noindex der Stage bleiben bestehen. Der Quell-Checkout bleibt au?erhalb der HTTP-Wurzel gesperrt.

Neue Releases enthalten public/, api/, src/ und nur den ben?tigten Avatarkatalog sowie interne Buildwerkzeuge. public_html zeigt auf releases/<version>/public. Uploads bleiben in shared/uploads. Vor der ersten Ver?ffentlichung muss Migration 009 ausdr?cklich separat angewendet werden. Ein Code-Rollback l?scht diese additive Tabelle nicht.

Der Worker aktualisiert seine installierte Fassung erst nach einem erfolgreich gepr?ften Code-Release. T?gliche Pflege entfernt abgelaufene Sitzungstokens nach sieben Tagen und Runden-Snapshots nach 90 Tagen. Ergebnisse und Nutzer bleiben erhalten. Mindestens zehn Dateireleases und immer aktives/vorheriges Release bleiben gesch?tzt; zus?tzliche Releases und Archive werden fr?hestens nach sieben Tagen entfernt. Code-Rollback ersetzt kein externes DB-/Uploadbackup.

## Grenzen und getrennte Folgearbeiten

Keine neuen Produktfunktionen: Lernverlauf, Fehlerwiederholung und Tagesquiz bleiben separat. Historische Fragen wurden nicht neu recherchiert; fehlende Quellen und Bildbeschreibungen wurden nicht erfunden. Responsive Bildvarianten ben?tigen eine eigene sichtbare Qualit?tspr?fung. Backendmodule behalten vorerst funktionale Schnittstellen; eine vollst?ndige Klassen-/Frameworkmigration ist nicht erforderlich. Der Admin-UI-Orchestrator bleibt gr??er und kann bei zuk?nftigen Feature?nderungen schrittweise weiter aufgeteilt werden.

## Validierung

Contracttests, isolierte Migration-/Account-/Admin-/SMTP-/Quiz-Integrationstests und PHP-Syntaxpr?fungen. Browserpr?fung: komplette angemeldete F?nf-Fragen-Runde, falscher erster Versuch, richtiger zweiter Versuch, Fokusf?hrung und best?tigte Ergebnisablage. HTTP-Pr?fung interner Dateien ergibt 404. Hostinger-Ver?ffentlichung und Content-Worker werden zus?tzlich am tats?chlichen Staging-Release ?berpr?ft.
