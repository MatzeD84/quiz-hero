# Zweiter Arbeitsblock: Barrierefreiheit, Bedienung, SEO und Sicherheit

Stand: 19. September 2026. Ausgangspunkt ist der vom Benutzer bereitgestellte Commit `bcc5e58`. Alle folgenden Änderungen sind lokal; kein Commit, Merge oder Produktionsdeployment durch den Assistenten.

## 1. Barrierefreiheit

Die Dialoge für Ergebnis, Feedback, Footer, Cookie-Auswahl, Avatar und Importbeispiel verwenden native HTML-Dialoge mit einer gemeinsamen Fokussteuerung. Überschriften liefern den zugänglichen Namen. Der Hintergrund ist während eines modalen Dialogs inaktiv; Escape schließt den obersten Dialog, anschließend kehrt der Fokus zum Auslöser zurück. Ältere generierte Landingpages werden beim Initialisieren des Footers an die neue Dialogsteuerung angepasst.

Orange, Grün, Rot und Violett wurden für lesbare helle Beschriftungen abgedunkelt. Footerlinks, sichtbarer Tastaturfokus und reduzierte Bewegung werden berücksichtigt. Neue Fragen erhalten den Fokus. Bildbeschreibungen können redaktionell gepflegt werden; ein Bildladefehler wird angezeigt und erlaubt das Überspringen.

Grenze: Die bestehenden Bildfragen haben noch nicht überall eine fachlich geeignete Beschreibung. Eine vollständige Screenreader- und WCAG-Abnahme ist damit nicht behauptet. Grundlage: [W3C Dialogmuster](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) und [native Dialoge](https://www.w3.org/WAI/WCAG21/Techniques/html/H102).

## 2. Adminbedienung

Fragen- und Kategorieformulare erkennen ungespeicherte Änderungen. Wechsel, Neuladen, Verlassen und Logout verlangen bei offenen Änderungen eine ausdrückliche Entscheidung. Abbrechen erhält die Eingaben; Verwerfen stellt die vorherigen Werte wieder her. Erfolgreiches Speichern setzt den Änderungsstatus zurück. Neue Datensätze bleiben nach dem Speichern ausgewählt.

Netzwerkfehler, ungültige Serverantworten und HTTP-Fehler werden verständlich gemeldet. Während des Speicherns werden parallele Formularaktionen gesperrt. Mobile Fragen- und Medienlisten sind in der Höhe begrenzt; beim Öffnen einer Frage erhält der Editor den Fokus. Die Speichernleiste für Fragen bleibt mobil erreichbar.

## 3. Account und Mail

Auf der Loginseite kann eine Bestätigungsmail erneut angefordert werden. Der Endpunkt begrenzt Anfragen und gibt dieselbe Antwort für unbekannte, bestätigte und unbestätigte Konten. Ein Versandfehler lässt den vorherigen Bestätigungslink bestehen. Ein erfolgreich verschickter Ersatzlink ersetzt ältere Links. Bestätigungs- und Resetparameter werden unmittelbar aus der sichtbaren Adresszeile entfernt.

Der Integrationstest startet einen eigenen SMTP-Empfänger ausschließlich auf Loopback. Er prüft Registrierung, tatsächlichen SMTP-Dialog, Links aus dem Mailinhalt, erneuten Versand, Verifikation, Login, Reset und Sitzungswiderruf. Es werden keine externen Empfänger angeschrieben. TLS, Zugangsdaten und Zustellung beim produktiven Mailanbieter sind separat auf Produktion abzunehmen.

## 4. Quizablauf

Die Punkteregeln stehen vor dem Start. Runden werden im Sitzungsspeicher des jeweiligen Browsertabs bis zu 24 Stunden wiederaufnehmbar gespeichert. Beim Fortsetzen werden Reihenfolge und Antworten gegen die aktuell geladenen Fragen geprüft; geänderte oder entfernte Fragen machen den alten Stand ungültig. Der Punktestand wird aus den gespeicherten Versuchen neu berechnet. Speicherblockaden führen zu einem Hinweis.

Bewusstes Abbrechen fragt nach; Abschließen oder Verwerfen entfernt den Zwischenstand. Ein erneuter Aufruf für eine bereits richtig beantwortete Frage kann keine weiteren Punkte vergeben. Der Ergebnisdialog enthält einen Lernrückblick mit Antworten, Bildern und vorhandenem Hintergrundwissen sowie den Status der Speicherung im Profil.

Grenze: Das ist eine Komfortfunktion pro Tab, keine geräteübergreifende Synchronisierung. Die Spielauswertung bleibt clientseitig und ist kein manipulationssicherer Wettbewerb.

## 5. SEO und GEO

Landingpages bekommen eine thematische H1 mit Fragenzahl, Bilder zu Bildfragen, Bildbeschreibungen, stabile Abschnittslinks und individuelle Quellen-/Prüfangaben, soweit vorhanden. Die Hauptseite verlinkt zu den Frageübersichten. Die Nachprüfung der Veröffentlichung berücksichtigt die neuen IDs an den Fragenblöcken.

Migration **008** ergänzt `editorial_json`. Die Felder `sourceUrl`, `imageAlt`, `reviewedBy` und `reviewedAt` werden im Admin gepflegt, validiert, gespeichert, importiert und öffentlich exportiert. Der Import übernimmt auch vorhandenes `meta.sourceUrl`. Ausführbare URL-Schemata und ungültige Prüfdatumsangaben werden abgewiesen. HTML-Ausgabe wird maskiert.

Zusätzlich enthält `data/category-sources.json` tatsächlich geprüfte weiterführende Verweise: [Turismo Roma](https://www.turismoroma.it/en), [Uffizien](https://www.uffizi.it/en), UNESCO für [Amalfi](https://whc.unesco.org/en/list/830/), [Neapel](https://whc.unesco.org/en/list/726/) und [Siena](https://whc.unesco.org/en/list/717/). Diese Verweise werden als weiterführende Informationen ausgewiesen, nicht als pauschaler Beleg jeder Antwort. Für bestehende Fragen wurden keine Prüfer, Prüfzeitpunkte oder Einzelbelege erfunden.

Die vollständige fachliche Prüfung des Fragenbestands bleibt redaktionelle Arbeit. Quellenfelder und strukturierte Seiten garantieren keine Aufnahme oder bevorzugte Zitierung durch Suchmaschinen oder KI-Systeme.

## 6. Sicherheitsprüfung und Härtung

Geprüft wurden fehlende Adminanmeldung, fehlende/falsche CSRF-Tokens, fremde Origins, Benutzerbindung der Sitzungstokens, Loginversuche mit SQL-Injection-Zeichen, Rate-Limits, ausführbare Quellen-URLs und maskierte SEO-Ausgabe. Der dynamische Avatarbau verwendet DOM-APIs statt interpolierter HTML-Attribute.

POST-Endpunkte weisen fremde Origins beziehungsweise `Sec-Fetch-Site: cross-site` zurück. Zusätzlich zu individuellen Loginlimits existieren gemeinsame IP-Limits gegen wechselnde Benutzernamen. Beim Adminlogin wird auch das CSRF-Token erneuert.

Apache liefert `nosniff`, Referrer-Policy, Permissions-Policy, Einbettungsschutz und eine durchgesetzte CSP für Basis-URLs, Objekte, Formulare und fremde Frames. Die weitergehende Script-/Ressourcen-CSP läuft zunächst im Report-Only-Modus; Meldungen erscheinen in den Entwicklerwerkzeugen, ein zentraler Reportempfänger ist nicht eingerichtet. HSTS gilt nur für HTTPS und enthält weder `includeSubDomains` noch Preload.

Die anschließend umgesetzte Umstellung auf HttpOnly-Cookies und CSRF-Schutz ist in [UMSETZUNG-HTTPONLY-COOKIES.md](UMSETZUNG-HTTPONLY-COOKIES.md) dokumentiert. Damit ist die hier noch beschriebene Bearer-Sitzung nicht mehr der aktuelle lokale Stand. Grundlage: [OWASP Sitzungen](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) und [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Dies sind gezielte Sicherheits- und Regressionstests, kein vollständiger externer Penetrationstest. Verteilte Angriffe, produktive TLS-Konfiguration und Hostingrechte sind nicht umfassend geprüft.

## Tests und Veröffentlichung

- Neun JavaScript-/SEO-Tests erfolgreich: einschließlich Cookie-/CSRF-Vertrag sowie der bisherigen Formular-, Quiz-, Daten- und Buildverträge.
- 40 PHP-/MySQL-Integrationsprüfungen erfolgreich, ausschließlich in einer isolierten Testdatenbank. Migrationen funktionieren aus leerer Datenbank sowie neuem und altem Snapshot.
- Lokaler Datenbankexport erzeugt fünf Kategorieseiten unter `.build/seo-local`. Die produktiven Seiten wurden nicht ersetzt.
- Chrome bestätigt verschachtelte Cookie-Dialoge mit Fokusrückgabe, Adminlogin und Erhalt ungespeicherter Eingaben beim abgebrochenen Wechsel sowie Quiz-Wiederaufnahme mit identischem Punktestand und gesperrten Antworten.
- Ein im Browser simulierter Fetch-Ausfall beim Adminspeichern erhält die Eingaben, zeigt den Fehler an und gibt das Formular wieder frei. Die Teständerung wurde verworfen und nicht gespeichert.
- Chrome bei 390 px: Startseite, Admineditor und geöffnete Bildfrage der neuen Rom-Landingpage ohne horizontalen Überlauf. Die Rom-Vorschau enthält eine H1, 72 Fragenanker und 52 Fragebilder entsprechend dem lokalen Datenbestand. Avatarwahl fokussiert den Dialogtitel und gibt nach Escape den Fokus zurück. Lokaler Entwicklungslogin und Logout funktionieren.
- Die wiederaufgenommene Testrunde endet mit 10/10 Punkten und drei richtigen Antworten; Ergebnisdialog, Gast-Speicherhinweis und Lernrückblick sind sichtbar.
- Mobile Lighthouse-Snapshots: Startseite und Rom-Vorschau jeweils Accessibility/Best Practices/SEO 100; angemeldeter Admin Accessibility/Best Practices 100, SEO 83 wegen fehlender Meta-Description. Diese privaten Adminseiten werden nicht für Suchmaschinen optimiert. Automatische Punktzahlen ersetzen keine vollständige Abnahme.
- Helle Beschriftung `#ecf0f1` auf den vier korrigierten Akzentfarben erreicht rechnerisch 4,91:1 bis 5,77:1 Kontrast.
- Sicherheitsheader wurden über HTTP auf `localhost:8080` geprüft.

Vor dem manuellen Deployment muss **Migration 008** auf dem Zielsystem angewendet werden; Migration 007 bleibt Voraussetzung. Lokal ist 008 bereits angewendet. Anschließend Anwendung und neu erzeugte SEO-Seiten gemeinsam veröffentlichen und produktives SMTP sowie HTTPS-Header prüfen. Die bestehenden Hinweise in `UMSETZUNG-1-6.md` gelten ergänzend.

Für die unabhängige lokale Ansicht der frisch erzeugten SEO-Seiten:

```powershell
node scripts/preview-seo.js .build/seo-local
```

Die Vorschau läuft ausschließlich auf Loopback unter `http://127.0.0.1:8082/kategorie/rom.html`. Sie liest die generierten Seiten und lädt Assets aus der weiterhin nötigen Anwendung auf Port 8080. Sie ersetzt keine Dateien unter dem bisherigen `kategorie/`-Verzeichnis und verändert keine Daten. Canonicals behalten die beim Build konfigurierte Zieladresse. `SEO_PREVIEW_PORT` erlaubt einen anderen Port.
