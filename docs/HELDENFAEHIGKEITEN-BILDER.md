# Heldenfähigkeiten – Bildmotive

**Production-Stand 31.10.2026:** Der aktuelle implementierte Helden-/Belohnungsstand ist mit Release `97ff6254492f-20261031202004` veröffentlicht. Datierte lokale Prüfnotizen darunter dokumentieren die Vorabprüfung; vorgemerkte Ideen bleiben nicht implementiert. Nachweis und Datenübertragung: [Helden-Rollout](HELDEN-ROLLOUT-2026-10-31.md).

Stand: 31.10.2026, lokal implementiert, noch nicht veröffentlicht.

## Neue Motive: Scharfblick und Glücksanker (31.10.2026)

Mit dem eingebauten Imagegen-Werkzeug erzeugt, ohne separate API oder API-Key. Stilreferenz: vorhandenes `heldenblick-v1.png`, visuell geprüft. Zwei separate transparente RGBA-PNGs mit je 1254 × 1254 Pixeln, Goldrahmen, Petrol und Hero-Lila. Projektkopien:

| Fähigkeit | Projektdatei | Motiv |
|---|---|---|
| Scharfblick | `public/images/abilities/scharfblick-v1.png` | Goldene Lupe, türkise Linse und lila Lichtstern |
| Glücksanker | `public/images/abilities/gluecksanker-v1.png` | Goldener Anker mit lila vierblättrigem Kleeblatt |

Migration `027_focus_lucky_images.sql`, auch im Schema-Snapshot enthalten, verknüpft die Motive einmalig mit den unveränderten Definitionen (noch kein Bild und Revision 1). Sie überschreibt keine später bearbeiteten oder bewusst entfernten Motive. Die Katalogrevision wird erhöht. Ausschließlich `quiz_abilities.image_url` und `revision` betroffen; keine neuen Tabellen/Felder. Die Bilder erscheinen automatisch in der Mediathek unter Heldenfähigkeiten, im Fähigkeiteneditor, bei der Heldenvorstellung, im Quiz und bei neuen Lernerfolgen. Laufende Rundensnapshots bleiben unverändert. Motive später über die bestehende Verwaltung änderbar.

Lokal vor Anwendung gesichert: `.private/before-focus-lucky-images-20261031.sql`; danach `php database/migrate.php`. Für ein späteres Deployment beide Dateien und Migration gemeinsam ausliefern, Uploads erhalten und normale Datenbank-/Upload-Sicherung durchführen. Ein Code-Rücksprung kann die Bildpfade stehen lassen; Dateirücksprung benötigt diese Dateien weiterhin oder passend korrigierte Pfade. Production unverändert.

Geprüft: beide PNGs im Browser erfolgreich geladen, 1254 × 1254 Pixel, transparenter Eckpixel (Alpha 0) und sichtbares Motiv. Datenbankpfade entsprechen den Projektdateien; beide Katalogrevisionen nach Migration 2. Keine Änderung an Spiellogik oder Lernschwellen.

### Prompt: Scharfblick

Use case: stylized-concept. Generate one finished standalone game ability emblem for Quiz-Hero: SCHARFBLICK (sharp focus, removing two false answers). Style reference is the gold/petrol/violet circular eye medallion just viewed in this conversation. Match its collectible series, broad polished low-poly triangular facets, golden beveled circular rim, dark petrol faceted inner field, violet accents. Subject: a single bold golden magnifying glass with a bright faceted turquoise lens and a simple violet star-shaped glint inside, short diagonal gold handle. Distinct from an eye/visor and a compass. Large instantly recognizable silhouette at 40px, no fine tiny ornament. Front-facing circular badge centered on square canvas, full circle visible with about 4 percent transparent margin. Genuine transparent alpha outside circle. No scene, no shadow outside, no text, no letters, no numbers, no people, no watermark. Create only this one emblem.

### Prompt: Glücksanker

Use case: stylized-concept. Generate one finished standalone game ability emblem for Quiz-Hero: GLÜCKSANKER (a small consolation safety net after a wrong answer). Style reference is the gold/petrol/violet circular ability medallions viewed and generated in this conversation. Match that exact collectible series: polished broad low-poly triangular facets, chunky golden beveled circular rim, dark petrol faceted inner field, vivid turquoise and Hero-purple accents. Subject: a single bold upright golden nautical anchor, symmetrical, with a small purple faceted four-leaf clover at its center. Clear anchor silhouette and large shapes readable at 40px; no rope clutter, no tiny ornament. Front-facing circular badge centered on square canvas, complete circle visible with 4 percent transparent margin. Genuine transparent alpha background outside circle. No text, letters, numbers, people, landscape, watermark or shadow outside circle. Create only this one emblem.

## Ursprüngliche drei Motive (23.10.2026)

Erzeugt mit dem eingebauten Imagegen-Werkzeug (ChatGPT-Anmeldung, keine separate API). Stilreferenz: `public/images/souvenirs/rom-token-v1.png`. Drei separate transparente PNGs, jeweils 1254 × 1254 Pixel: Goldrahmen, Low-Poly-Facetten, Petrol und Hero-Lila. Originale bleiben unverändert im Imagegen-Ausgabeordner; Projektkopien liegen unter `public/images/abilities/`.

| Fähigkeit | Projektdatei | Motiv |
|---|---|---|
| Heldenblick | `heldenblick-v1.png` | Goldenes Auge mit türkiser Iris und lila Maske |
| Schutzschild | `schutzschild-v1.png` | Lila Schild mit goldenem Rand und türkisem Kristall |
| Neues Abenteuer | `neues-abenteuer-v1.png` | Goldener Kompass mit gebogenem Pfeil |

## Verwendete Prompts

### heldenblick

Use case: stylized-concept. Generate one finished game achievement emblem for Quiz-Hero's hero ability heldenblick. A single stylized superhero eye/visor symbol, a bright faceted golden eye with a teal iris and a subtle violet mask-shaped surround. No face, no head, no human. Match the supplied project souvenir reference stylistically: polished low-poly triangular facets, clean bold readable silhouette, warm golden highlights, rich petrol/teal and Hero-purple accents. A circular collectible medallion with a simple faceted gold rim and dark petrol inner field; the symbol is large and instantly readable at 96 pixels. Front-facing centered square composition, whole circular medallion visible, 8 percent transparent margin, consistent collectible badge series. Real transparent background outside the circle. Crisp stylized illustration, moderately simplified broad facets, no photorealistic texture, no excessive tiny details. NO text, NO letters, NO numbers, NO people, NO watermark. Reference image is style only; do not include architecture or the Colosseum.

### schutzschild

Use case: stylized-concept. Generate one finished game achievement emblem for Quiz-Hero's hero ability schutzschild. A single strong heraldic shield, gold beveled rim, violet enamel polygon facets and one luminous small teal diamond in the center. No weapons, no human. Match the supplied project souvenir reference stylistically: polished low-poly triangular facets, clean bold readable silhouette, warm golden highlights, rich petrol/teal and Hero-purple accents. A circular collectible medallion with a simple faceted gold rim and dark petrol inner field; the symbol is large and instantly readable at 96 pixels. Front-facing centered square composition, whole circular medallion visible, 8 percent transparent margin, consistent collectible badge series. Real transparent background outside the circle. Crisp stylized illustration, moderately simplified broad facets, no photorealistic texture, no excessive tiny details. NO text, NO letters, NO numbers, NO people, NO watermark. Reference image is style only; do not include architecture or the Colosseum.

### neues-abenteuer

Use case: stylized-concept. Generate one finished game achievement emblem for Quiz-Hero's hero ability neues-abenteuer. A single golden compass with a turquoise and violet faceted compass rose and a clearly visible curved golden arrow around the compass representing switching to a new adventure. No letters or compass direction lettering. Match the supplied project souvenir reference stylistically: polished low-poly triangular facets, clean bold readable silhouette, warm golden highlights, rich petrol/teal and Hero-purple accents. A circular collectible medallion with a simple faceted gold rim and dark petrol inner field; the symbol is large and instantly readable at 96 pixels. Front-facing centered square composition, whole circular medallion visible, 8 percent transparent margin, consistent collectible badge series. Real transparent background outside the circle. Crisp stylized illustration, moderately simplified broad facets, no photorealistic texture, no excessive tiny details. NO text, NO letters, NO numbers, NO people, NO watermark. Reference image is style only; do not include architecture or the Colosseum.


