ToDos:
- über data-difficulty="easy|medium|hero" CSS anpassen
- questions.json --> data-difficulty per chatGPT bewerten
- questions.json --> sinvolle tag per chatGPT ergänzen


ToDos ChatGPT:

- ChatGPT fragen ob ajax sin macht, um nicht vorher schon im quellcode 
  die richtigen antworten zu sehen

- sicherheit
- end-zu-ent-Tests, Test
- SEO

- Datenbank: Aufwand, sinvoll?

- Sinnvoll die JS Klassen auf mehrere files zu verteilen?
- Mehrere json-Datein anlegen pro Kategorie?

- Hintergrundwissen ausbauen: Nach der Antwort einen kurzen „Fun Fact“ oder Link anbieten; optional nur bei Interesse einklappbar.






-Optional: Fortschrittsspeicherung: Score/Position per localStorage sichern, damit ein Reload nicht den Run zerstört (kann man mit einer kleinen Version-ID koppeln).



-------------------------------------------------------------

Highlights JS

Getrennte Klassen (QuizDataService, QuizState, QuizView, QuizController) sorgen für klare Verantwortlichkeiten; jede lässt sich eigenständig testen oder austauschen.
Alle Selektoren und Konfigurationen (URLs, Scores, maximale Versuche) stecken in Konstanten am Anfang – spätere Anpassungen brauchen nur hier geändert zu werden.
Fragen werden tief kopiert und per QuizState verwaltet; Originaldaten bleiben unverändert und mehrere Runden sind sauber möglich.
UI-Updates laufen über QuizView, d. h. DOM-Manipulation hängt nicht mehr im Controller – erleichtert Theme-Wechsel oder das Umsteigen auf ein anderes View-System.
Fehlerfälle (ungenützte Kategorien, Fetch-Probleme) werden geloggt und mit kurzen Mitteilungen im UI abgefedert.
Alle Event-Listener sind an einer Stelle registriert, wodurch sie zentral anpassbar bleiben (z. B. für Keyboard-Steuerung).
Animations-/Feedback-Logik (Score-Animation, Korrektur-Icons, Hintergrundwissen) sitzt im View und reduziert Code-Duplizierung.
Anpassbar: Du kannst weitere Kategorien oder andere Punkteregeln einführen, ohne tief in die Logik zu greifen; falls du später z. B. eine Tag-Übersicht brauchst, ergänzt du nur View + Controller.

Der neue Aufbau ist deutlich robuster und wartbarer:

Klare Verantwortlichkeiten: Datenzugriff, State-Management, View und Controller sind getrennt. So lassen sich Teile austauschen oder testen, ohne dass der Rest betroffen ist.
Konfigurierbarkeit: URLs, Punktelogik und Selektoren sind zentral definiert. Anpassungen brauchen keine Code-Suche mehr im gesamten Skript.
Sauberer Zustand: Fragen werden kopiert, der State verwaltet Versuche/Score, und UI-Zustände hängen nicht mehr an globalen Variablen.
Tests & Erweiterungen: Durch die Aufteilung kannst du QuizState oder QuizDataService isoliert testen, ein anderes View-System anschließen oder neue Features (z. B. Tags, Timer) gezielt ergänzen.
Kurz: weniger Spaghetti, mehr Struktur – also ja, besser als die vorherige Variante.