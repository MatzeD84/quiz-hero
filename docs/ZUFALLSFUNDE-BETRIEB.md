# Zufallsfunde – Anwendung und Betrieb

Stand 01.11.2026: lokal und auf Production veröffentlicht, Migration 028 angewendet. Release `b60be48625bc-20261101153903`. Bedienung und Spielregeln stehen unter [Heldenbelohnungen](HELDENBELOHNUNGEN.md); Backup und Veröffentlichungsnachweis im [Production-Protokoll](HOSTINGER-PRODUCTION.md).

## Migration 028

`database/migrations/028_avatar_random_finds.sql` ergänzt:

- `quiz_avatars.drop_chance_bp`: ganzzahlige Hundertstel eines Prozents (5 = 0,05 %, 5000 = 50 %), 0 als unkonfigurierter Standard; maximal 10000. Aktive Zufallsfund-Konfigurationen benötigen mindestens 1.
- `quiz_rounds.avatar_drops_json`: eingefrorene aktive Fundhelden samt Chance. NULL bei Bestandsrunden bedeutet keine Fundprüfung. Neue Runden erhalten einen Snapshot, gegebenenfalls eine leere Liste.
- Der bestehende Marker `quiz_avatars.unlock_rule` verwendet für die dritte Verfügbarkeit `random_drop`. Persönliche Vergaben bleiben in `quiz_user_avatar_unlocks`, einschließlich Quelle und `rule_snapshot` mit `type`, `chanceBp` und Gewinnposition. Keine Änderung vorhandener Freischaltungen.

Der Schema-Snapshot enthält dieselbe Migration. Die Migration ist wiederholbar und legt keine Testhelden oder persönlichen Vergaben an. Die lokale Konfiguration der Winterseherin mit 50 % erfolgte separat nach Sicherung, ohne bestehende aktive Leistungsregel zu überschreiben.

## Auswertung und Grenzen

Der Server verwendet `random_int(1,10000)` je richtiger Antwort und noch nicht besessenem Fundhelden. Eine Transaktion mit Account- und Rundensperre speichert Ergebnis und Freischaltung gemeinsam. Bereits abgeschlossene Runden liefern bei identischer Wiederholung dasselbe Ergebnis; Sammlungsabgleich würfelt nicht. Der Browser kann weder Chance noch Fundentscheidung vorgeben. Es gibt keinen zusätzlichen Request pro Frage.

Die Chance stammt vom Rundenstart. Beim Abschluss muss der Held weiterhin aktiv, nicht gelöscht und als Zufallsfund eingestellt sein. Mehrere Helden dürfen unabhängig gewinnen. Ein Held wird je Account höchstens einmal freigeschaltet; nach dem Gewinn sind weitere Prüfungen für ihn unnötig. Ein Transaktionsfehler veröffentlicht weder Ergebnis noch Freischaltung; ein späterer Wiederholungsversuch kann dann erneut auswerten, aber nicht mehrere Vergaben erzeugen.

Die Heldenverwaltung validiert Dezimalwerte ohne stille Rundung, schützt den Standardhelden, prüft Adminrechte, CSRF und Bearbeitungsversion. Eine vorhandene Leistungsregel bleibt bei Umstellung erhalten, ist für Zufallsfund-Helden aber nicht wirksam und kann erst nach bewusster Umstellung auf Belohnung wieder bearbeitet werden. Bildaustausch in der Mediathek erhält Fundart und Chance.

## Späteres Deployment und Rücksprung

Vor Veröffentlichung Datenbank und Uploads nach dem [Deploymentablauf](../deployment/README.md) sichern, Migration 028 ausdrücklich anwenden und erst danach Code ausliefern. Gewünschte Fundhelden und Chancen separat freigeben und konfigurieren; kein Import der lokalen Datenbank oder persönlicher Freischaltungen. Der lokale 50-%-Wert ist kein automatischer Produktionsstandard.

Die Migration ist additiv. Ein Dateirücksprung lässt Spalten und bestehende Rechte stehen, ältere Software vergibt jedoch keine neuen Zufallsfunde und versteht deren Adminpflege nicht. Vorzugsweise vorwärts korrigieren. Kein destruktiver Rückbau und kein Datenbankrestore ohne Beachtung seitdem entstandenen Fortschritts.

## Prüfung

Automatisierte Prüfungen decken Dezimalgrenzen, getrennte Ziehungen je richtiger Antwort, Erst-/Zweitversuch, falsche und übersprungene Antworten, eingefrorene Chancen, Wiederholung des Speicheraufrufs, Besitzschutz, fehlende historische Nachvergabe, Deaktivierung, unabhängige Mehrfachfunde sowie Adminschutz und Migrationserhaltung ab. Frontendprüfungen prüfen Fundtext, Prozentbeschreibung und Auswahlverweis. Die Backendprüfung läuft ausschließlich in einer leeren Wegwerfdatenbank.

Abschluss am 01.11.2026: 58 Frontend- und 337 isolierte Integrationsprüfungen erfolgreich; PHP-/JavaScript-Syntax geprüft. Browserprüfung mit simulierten Adminantworten bestätigt sichtbare Fundchance, gültige Eingabe `0,05`, anfangs gesperrten Speicherbutton und Schließen samt Statusmeldung nach erfolgreichem Speichern. Keine Produktionsdaten verändert. Lokale Datenbank vor Migration gesichert; danach Winterseherin mit 50 % eingerichtet, ohne betroffene Accounts auf Standard umstellen zu müssen.
