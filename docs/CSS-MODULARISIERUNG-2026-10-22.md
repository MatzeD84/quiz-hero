# CSS-Modularisierung – 22.10.2026

**Auf Production veröffentlicht mit Release `cb23f51a0cc4-20261022131903`.** Die Strukturpflege ändert keine Spielregeln, Datenbank oder Nutzerabläufe. Die Darstellung des zuvor veröffentlichten Stands dient als Vergleichsbasis. Die später ergänzten Quiz-Tags, Punktehinweise und Hoverfarben sind eine separate, bewusst sichtbare Änderung; Abschlussprüfung und Rollout: [Quiz-Release](QUIZ-ABSCHLUSSPRUEFUNG-2026-10-22.md).

## Zuständigkeiten

- `abstracts/tokens.css` und `themes/app-tokens.css`: zentrale Designwerte, vor den darstellenden Modulen geladen. `themes/` enthält keine Komponentenregeln mehr.
- `base/`: Reset, Typografie und Links; `accessibility.css` für globalen Fokus und reduzierte Bewegung.
- `layout/`: Container, Hauptheader, Footer und Kontomenü einschließlich jeweiliger Breakpoints.
- `components/`: gemeinsam verwendete Buttons, Formulare, Tabs, Dialoge und Statusmeldungen. `cards.css` vereint Kategorie-/Themenkarten mit Motiven, Badges, Text und Zuständen.
- `features/account/`: Konto, Login, Profilkachel und Formular, Reisepass und Souvenirs. Die Flächenregeln der früheren Shell-Sammeldatei liegen jetzt beim verantwortlichen Feature.
- `features/quiz/`: Auswahl, Layout, Medien, Antworten, Rückmeldung, Ergebnis und Navigation. Der generische Iconstil bleibt unter Komponenten, der Quiz-Abbruch unter `navigation.css`.
- `features/admin/`: Adminlayout, Listen, Formulare, Mediathek, Profilbilder, Uploads und sonstige Adminbereiche.

`styles/main.css` lädt 57 CSS-Quellen. `public/styles.css` bleibt die automatisch gebaute Browserdatei. `themes/app.css`, `base/responsive.css`, `components/shell.css`, `components/badge.css`, `components/card-content.css` und `components/card-base.css` sind durch die genannten Verantwortlichkeiten ersetzt. Bestehende BEM-Klassen bleiben erhalten.

## Kaskade und Bereinigung

Responsive Regeln sind beim jeweiligen Block untergebracht. Doppelte, später ohnehin überschriebene Deklarationen wurden innerhalb ihrer Kontexte entfernt; Zustände und Media Queries bleiben geordnet. Tatsächlich wirksame Werte aus der bisherigen Kaskade wurden in den zuständigen Modulen ausdrücklich erhalten, unter anderem für Weiter-Button, Quiz-Abbruch, Admin-Tabs, Medienfilter und Formularfelder. Überholte Faltband-Geometrie der Badges wurde entfernt, ihre sichtbare Darstellung bleibt gleich.

Die Tokenprüfung verhindert künftig gewöhnliche Layoutdeklarationen in den Token-Dateien und zusätzliche zentrale Theme-Override-Dateien. Die bestehenden Skalen und semantischen Farben bleiben erhalten. Neue Features sollen ihre Regeln in ihren Modulen ergänzen, nicht erneut eine globale Reparaturdatei aufbauen.

Die Token-Dateien wurden anschließend ebenfalls vereinfacht: `abstracts/tokens.css` enthält gemeinsame Skalen, Typografie, Geometrie und Bewegung; `themes/app-tokens.css` die vollständige Palette und farbabhängige Rahmen/Schatten. Alle zuvor wirksamen Tokenwerte wurden vor und nach der Zusammenführung automatisch verglichen und unverändert übernommen. Jeder zentrale Token ist nur einmal definiert. Diese Ergänzung bleibt ebenfalls lokal.

## Prüfung

Vorher-/Nachher-Vergleich im lokalen Browser mit einer zusammengesetzten DOM-Prüfansicht aus Startseite/Quiz, Login, Konto, Admin, Reisepass und Souvenir-Seite. Versteckte Bereiche wurden für den Vergleich sichtbar gemacht; ergänzt wurden freie/gesperrte Heldenkarten, alle vier Souvenirpaare sowie normale, richtige, falsche und gesperrte Antworten. Es werden keine Accountdaten verändert oder Ergebnisse gespeichert.

Der Vergleich liest die berechneten CSS-Eigenschaften der Elemente und ihrer `::before`-/`::after`-Pseudoelemente unter der alten und neuen CSS-Fassung auf demselben DOM. Unterschiedliche Importreihenfolgen wurden anhand dieser Befunde korrigiert. Hover-/Fokus-/Aktiv-/Besucht-Regeln werden zusätzlich durch äquivalent gewichtete Prüfklassen in beiden Stylesheets gegenübergestellt. Dies ist ein Stil-/Layoutvergleich, keine vollständige Pixel- oder Geräteprüfung.

Vergleichsbasis: veröffentlichter Commit `8b84553884fa8fefdde25543a194d6c962f74be6`. Abschließend 943 DOM-Elemente samt Pseudoelementen bei **320, 390, 600, 760, 768, 1000, 1024 und 1440 Pixeln** geprüft: **keine Unterschiede** der verglichenen berechneten CSS-Eigenschaften. Zusätzlich Interaktionsregeln bei 390 und 1440 Pixeln ohne Abweichung; der Hauptvergleich verwendet reduzierte Bewegung, um Animationen nicht zu unterschiedlichen Zeitpunkten zu messen.

Tokenprüfung, CSS-Build, BEM-Prüfung, alle **33 Frontendtests** und lokaler Hostinger-Build erfolgreich. Der Build wurde mit lokaler JSON-SEO-Vorschau geprüft, nicht auf Production veröffentlicht. Dokumentlinks und `git diff --check` geprüft. Temporäre öffentliche Vergleichsdatei entfernt; die Ausgangskopie liegt nur im ignorierten privaten Arbeitsbereich. Keine Backend-/Datenbankänderung, daher kein erneuter Datenbank-Integrationstest nötig.

Pflege- und Buildregeln: [CSS-Design-System](../styles/README.md).
