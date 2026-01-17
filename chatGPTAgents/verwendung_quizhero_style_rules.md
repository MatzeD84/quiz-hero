# QuizHero Image Agent – Notizen / Anleitung (Update: soft / medium / strong)

## Ziel
Der Agent erstellt konsistente **2:1 Bannerbilder** im **QuizHero Low-Poly Stil**.

**Fix immer aktiv:**
- ✅ 2:1 Querformat
- ✅ **keine Menschen**
- ✅ **keine Tiere**
- ✅ **kein Text/Logo/Wasserzeichen/Schilder**
- ✅ polygonaler Low-Poly Look, klare Facetten

---

## 1) Modi (wichtig!)

### soft
**Nah am Original**, dezenter Stiltransfer (konservativ).
- Uploads bleiben relativ originalgetreu
- Low-Poly Effekt moderat

### medium (Standard / Empfehlung)
**Nah am Original**, aber **deutlich stärker polygonal**.
- entspricht deinem gewünschten QuizHero-Standardlook
- ideal für Bild-Uploads (Fotos sonst zu realistisch)

### strong (Kategorie/Tag / Hero-Quiz)
**Maximaler Polygon-Look** wie deine Kategorie-/Tag-Hero-Bilder:
- stark sichtbare Polygone überall
- kaum bis keine feinen Details / keine Texturen
- Komposition darf optimiert werden für „Key Visual“

---

## 2) Variante A: Text → Bild

### Minimal
`Bild: <Motiv> (GENERATE)`

**Beispiele:**
- `Bild: Rom Kolosseum sunset (GENERATE)`
- `Bild: Neapel Vesuv Blick über die Bucht (GENERATE)`
- `Bild: Paris Eiffelturm night snow (GENERATE)`

### Modus explizit setzen
`Bild: <Motiv> – mode: soft|medium|strong (GENERATE)`

**Beispiele:**
- `Bild: Rom Forum Romanum – mode: medium (GENERATE)`
- `Bild: Amalfi Küste – mode: strong (GENERATE)` *(perfekt für Kategorie/Tags)*

⚠️ Wenn Modus nicht angegeben: Agent fragt 1× nach soft/medium/strong  
(oder nutzt Default **medium**)

---

## 3) Variante B: Bild hochladen → Stiltransfer

### Minimal (Standard: medium)
Upload + Text:
- `Amalfi Küste`
- `Forum Romanum Rom`

### Modus setzen
Upload + Text:
- `Amalfi Küste – mode: soft`
- `Amalfi Küste – mode: medium`
- `Amalfi Küste – mode: strong`

---

## 4) Bild hochladen + Anpassungen (Edit-Anweisungen)
Format:
`<Motiv> – <Änderungen>`

**Beispiele:**
- `Amalfi Küste – Berge nicht abgeschnitten zeigen`
- `Amalfi Küste – mehr Himmel, weniger Vordergrund`
- `Rom Kolosseum – stärkerer low-poly Himmel und Pflanzen`
- `Forum Romanum – Hintergrund ruhiger, weniger Details`
- `Vesuv – mehr Meer, klarer Horizont`

✅ Erlaubt: Boot, Wolken, Nebel, Sonnenstrahlen  
❌ Verboten: Menschen, Tiere, Text/Schilder

---

## 5) 2 Bilder hochladen (Best Practice: Motiv + Style-Referenz)
- **Bild A** = Motiv (Komposition beibehalten)
- **Bild B** = Style-Referenz (QuizHero Look übernehmen)

Text dazu:
`Bild A = Motiv, Bild B = Style-Referenz → mode: medium, Stiltransfer nah am Original, 2:1`

Für Kategorie/Tags:
`Bild A = Motiv, Bild B = Style-Referenz → mode: strong (Hero Key Visual), 2:1`

---

## 6) Parameter / Keywords (einfach in Text schreiben)

### Tageszeit
- `day`
- `sunset / golden hour`
- `night`
- `dawn`

### Wetter / Atmosphäre
- `clear`
- `snow`
- `fog`
- `rain`
- `dramatic sky`

### Mood / Farben
- `warm`
- `cool`
- `dramatic`
- `calm`

### Komposition / Banner-Optimierung
- `website header`
- `kein Leerraum`
- `mehr Himmel`
- `mehr Meer`
- `nicht abgeschnitten zeigen`

### Stil-Boost (wenn nicht polygonal genug)
- `extra strong low-poly`
- `strong polygonization`
- `simplified shapes`
- `less detail`

---

## 7) Spezialregeln (wichtiger Qualitätshebel)
Gerade bei Upload-Fotos:

- **Vegetation** (Bäume/Blumen/Pflanzen): niemals realistisch → große Facetten, keine Blatt-/Blüten-Details
- **Himmel**: stark facettiert, viele kleine Polygone, keine glatten Verläufe
- **Wasser**: klar polygonal, darf feiner facettiert sein, keine Spiegel-Fototextur

Praktischer Zusatz:
`– stronger low-poly plants/sky/water`

---

## 8) Varianten (v1/v2/v3)
Varianten sind **3 leicht unterschiedliche Kompositionen/Looks** fürs gleiche Motiv:

- **v1:** Standard / balanced
- **v2:** andere Kamera/Perspektive (oft besser als Banner)
- **v3:** anderer Look/Licht/Stimmung oder stärkerer Polygon-Look

### Varianten anfordern
- `3 Varianten`
- `Varianten v1/v2/v3`

Beispiel:
`Bild: Rom Forum Romanum sunset – mode: medium – 3 Varianten (GENERATE)`

---

## 9) Kategorie/Tag / Hero-Quiz (Wichtig!)
Für Key Visuals immer:
- `mode: strong`
- weniger Details, klarer Polygon-Look

Beispiel:
`Bild: Amalfi Küste – Kategorie/Tags – mode: strong (GENERATE)`
