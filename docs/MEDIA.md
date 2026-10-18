# Mediathek: Bild austauschen

Die zentrale Bildverwaltung ist Bestandteil des Production-Releases mit den Profil- und Adminverbesserungen vom 18. Oktober 2026.

Im Admin unter Mediathek ein Bild auswählen, „Bild austauschen“ öffnen und eine neue Datei auswählen. Die Vorschau zeigt das neue Motiv; der Dialog nennt die Anzahl aktueller Verwendungen. Erst „Bild jetzt austauschen“ lädt die Datei hoch. Abbrechen verändert keine Dateien oder Zuordnungen.

Die Dateiauswahl im Austauschdialog nutzt dasselbe Drag-and-Drop-Kästchen wie die Mediathek. Ein Bild kann hineingezogen oder per Klick beziehungsweise Enter/Leertaste ausgewählt werden. Auch beim Ablegen wird zunächst nur die lokale Vorschau erstellt; der Austausch erfordert weiterhin die ausdrückliche Bestätigung.

## Speicherung und Zuordnungen

- `admin-media-replace` verwendet dieselbe Uploadprüfung wie normale Bilduploads: Adminsession, CSRF-/Origin-Prüfung, maximal 6 MB, gültiges JPG/PNG/WebP anhand tatsächlicher Dateiinhalte.
- Die neue Datei liegt mit zufälligem Namenszusatz unter `public/images/uploads/media/`. Der neue Pfad verhindert alte Browser-/CDN-Cachetreffer; die bisherige Datei wird nicht überschrieben.
- Innerhalb einer Datenbanktransaktion werden alle aktuellen Verweise in `quiz_questions.image_url` und `quiz_categories.icon` umgestellt. Auch lokale Pfadvarianten mit führendem `/` oder `../` werden erkannt. Externe URLs sind vom Austausch ausgeschlossen.
- Die Mediathek liefert einen Versionswert aus Dateiinhalt und aktuellen Verwendungen. Vor und nach Sperren der Katalogzeilen wird dieser geprüft. Bei zwischenzeitlichen Änderungen wird der Austausch abgebrochen; der Admin muss das Bild neu auswählen. Scheitert die Transaktion, wird die neue Datei wieder entfernt.
- Laufende Runden und unveränderliche Fragenversionen werden nicht umgeschrieben. Alte Dateien bleiben bestehen. In solchen gespeicherten Daten referenzierte Bilder sind vor dem Löschen in der Mediathek geschützt. Die Prüfung liest die bestehenden Snapshotfelder; keine zusätzliche Tabelle oder Migration ist nötig.
- Nicht mehr verwendete Projektbilder können weiterhin im Repository liegen. Der Austausch entfernt diese Dateien nicht aus dem Repository. Uploads bleiben wie bisher unabhängig vom Deployment erhalten.

## Oberfläche und Prüfung

Ein dezenter fest positionierter Hinweis unten links begleitet den Listenabruf und das Laden von Bildern im beziehungsweise nahe am Viewport. Lazy-Loading bleibt erhalten: Noch weit entfernte Bilder halten den Hinweis nicht dauerhaft offen. Erfolgreiche und fehlgeschlagene Bildanfragen beenden ihren Ladezustand; ein Tabwechsel oder Logout blendet den Hinweis aus. Bei reduzierter Bewegung bleibt das Symbol statisch. Die Verwaltung liegt in `public/js/admin/media-loading.js`.

Der Dialog verwendet die vorhandenen Modal-, Button- und Bildklassen. Die lokale Vorschau nutzt eine Blob-URL, die beim Schließen oder Auswählen eines anderen Bildes freigegeben wird. Während des Austauschs sind Mehrfachabsenden und Schließen gesperrt. Erfolgreicher Austausch lädt den Katalog und die Mediathek neu und wählt das neue Bild aus.

Isolierte Integrationstests prüfen die neue Route einschließlich fehlender Adminberechtigung/CSRF, ungültigem Pfad und Dateiinhalt, veralteter Version, automatischer Aktualisierung mehrerer Fragen plus Kategorie sowie Schutz historischer Bilder. Insgesamt 100 Integrationstests und 28 Vertragstests erfolgreich. Browserprüfung mit simuliertem Upload: Dateivorschau, explizite Bestätigung, Abbrechen ohne Upload und Dialog bei 390 Pixeln ohne horizontalen Überlauf. Keine produktiven Bilder oder Fragen verändert.
