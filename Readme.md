ToDos:
- Übersichtsseite
    - Styling Icons für Kategorien/Tags
    - Erstellung und Styling von decription für Kategorien/Tags
- über data-difficulty="easy|medium|hero" CSS anpassen
- questions.json --> data-difficulty per chatGPT bewerten
- questions.json --> sinvolle tag per chatGPT ergänzen
- detail-element stylen
- Service Worker / PWA: 
    Service Worker / PWA: Etwas aufwendiger, aber du könntest einen Service Worker registrieren, der bei neuen Deployments den Cache leert und die neuesten Dateien cached.

ToDos ChatGPT:


- end-zu-ent-Tests, Test
- SEO
- Datenbank: Aufwand, sinvoll?

- Sinnvoll die JS Klassen auf mehrere files zu verteilen?
- Mehrere json-Datein anlegen pro Kategorie?


-Optional: Fortschrittsspeicherung: Score/Position per localStorage sichern, damit ein Reload nicht den Run zerstört (kann man mit einer kleinen Version-ID koppeln).



-------------------------------------------------------------

Highlights JS

Wir haben das ursprüngliche monolithische script.js in einzelne ES‑Module aufgeteilt, damit Logik, Konfiguration und DOM-Anbindung sauber gekapselt und leichter wartbar sind:

js/config.js: Enthält alle Konfigurationswerte (URLs, Punktelogik, Labels, Selektoren, Cache-Version) sowie Hilfsfunktionen wie getPointsForDifficulty. So musst du künftige Anpassungen nur an einer Stelle ändern.
js/validators.js: Bündelt Schema-Prüfungen für questions.json und feedback.json. Manipulierte oder fehlerhafte Daten werden erkannt, bevor das Quiz startet, und halten so den Rest des Codes sauber.
js/quiz-data-service.js: Lädt Fragen/Feedback, führt die Validatoren aus und hängt einen Cache-Buster an die Fetch-Requests. Dadurch bleiben Datenkonsistenz und Cache-Verhalten zentral steuerbar.
js/quiz-state.js: Verwaltet Zustand (Kategorie/Tag, Fragenfolge, Score, Versuche). Fragen werden tief kopiert und über einen Tag-Index organisiert, wodurch du Kategorien/Tags sauber trennen und testen kannst.
js/quiz-view.js: Kümmert sich ausschließlich um DOM-Referenzen, Rendering und UI-Ereignisse (inkl. ESC-/Overlay-Schließen des Modals). Alle sichtbaren Texte nutzen LABELS, was Internationalisierung erleichtert.
js/quiz-controller.js: Verbindet DataService, State und View; behandelt die Nutzerflüsse (Kategorie/Tag wählen, Antworten prüfen, Hintergrundwissen erst nach Abschluss zeigen, Ergebnis-Modal).
js/main.js: Bootstrap-Datei, die beim DOMContentLoaded den Controller instanziiert und das Quiz startet.
index.html lädt nun styles.css?v=20250210 und das neue js/main.js?v=20250210 als Modul. Damit hast du klare Verantwortlichkeiten, bessere Testbarkeit und keine riesige JS-Datei mehr, was sowohl Wartung als auch zukünftige Erweiterungen (z. B. SSR/PWA) deutlich vereinfacht.


------


Eine Offline-PWA ist machbar, aber ein paar Bausteine sind nötig:

HTTPS + Manifest: Deine Seite muss über HTTPS laufen, dazu kommt ein manifest.json mit Icons, Name, Start-URL etc. – schnell erledigt.

Service Worker registrieren: Kleine JS-Datei, die du via navigator.serviceWorker.register('/sw.js') beim Laden startest. Das sw.js kümmert sich um Caching.

Caching-Strategie überlegen: Du definierst, welche Assets (HTML, CSS, JS, JSON, Bilder) beim Installieren gecacht werden und wie Requests bedient werden. Für eine Quiz-App brauchst du z. B.:

install-Event: caches.open('quiz-v1').then(cache => cache.addAll([...])), damit die wichtigsten Dateien offline verfügbar sind.
fetch-Event: Strategie wie „Cache-first mit Network-Fallback“ für Assets, und evtl. „Network-first“ für JSON, damit Fragen aktualisiert werden, wenn online.
Offline-Fallbacks: Überleg dir, was passieren soll, wenn jemand offline startet und die JSON-Dateien nicht im Cache sind (z. B. Hinweis anzeigen oder eine kleine Offline-Version mit zuletzt geladenen Fragen anbieten).

Vom Aufwand her: Ein Basis-Service-Worker ist in ein paar Stunden aufgesetzt. Komplex wird es, wenn du dynamische Inhalte synchron halten willst (z. B. Fragekatalog aktualisieren, während Nutzer offline waren) oder wenn du eigene Datenbanken nutzen willst (IndexedDB). Für eine erste „Offline nutzbar + installierbar“-Variante reicht es, die statischen Assets plus Fragen/Feedback zu cachen und beim Start zu prüfen, ob du online bist.

Kurz: Nein, kein riesiger Aufwand – aber ein paar Schritte sind nötig. Fang mit Manifest + einfachem Service Worker an, teste offline im Browser (DevTools → Application → Service Workers), und erweitere später, wenn du mehr brauchst.


-----------

Ja, kannst du – nur muss der Inhalt für Suchmaschinen aufbereitet werden, obwohl er clientseitig aus JSON kommt. Typische Wege:

Prerender/SSR: Erzeuge beim Deploy eine statische Variante Ihrer Seite mit allen relevanten Inhalten (z. B. per Node-Skript, das questions.json einliest und ein fertiges HTML rendert). Suchbots sehen dann sofort Text, Kategorien etc., statt auf JavaScript warten zu müssen.
Dynamisches Rendering/Prerendering-Service: Tools wie Rendertron, Prerender.io oder dein eigener Puppeteer-Worker liefern Bots eine vorgerenderte HTML-Version, während echte Nutzer weiterhin die SPA bekommen.
Structured Data (Schema.org): Du kannst JSON-LD in dein HTML einbetten (z. B. FAQPage oder Quiz-ähnliche Strukturen), damit Google versteht, dass es Fragen+Antworten sind, auch wenn der sichtbare Content erst per JS kommt.
Fallback-Serverrender: Wenn du langfristig planst, kannst du auf ein Framework wechseln, das SSR/SSG von Haus aus bietet (Next.js, Astro etc.) – dann ist SEO inhärent einfacher.
Kurz: Es reicht nicht, nur JSON per JS einzubinden. Entweder renderst du beim Build eine statische HTML-Ausgabe, nutzt einen Prerender-Service oder ergänzt strukturierte Daten, damit Bots deine Inhalte zuverlässig sehen.