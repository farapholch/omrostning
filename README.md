# Omrostning - Rocket.Chat Poll App

En svensk omröstnings-app för Rocket.Chat med realtids-uppdateringar.

## Features

- Enkel röst (ett val) eller flerval
- Valbar anonymitet (🔒)
- Tidsgräns med auto-stängning (⏰)
- Ändra/ta bort röst (toggle)
- Realtids progress bars (🟩⬜)
- Öppna igen avslutad omröstning (ägare)
- Ranking-emoji vid avslut (🥇🥈🥉)

## Design

**Pågående omröstning:**
```
🗳️  OMRÖSTNING

Vad ska vi äta till lunch?

🔒 Anonym · ⏰ Stänger 15:30
────────────────────────
Pizza
🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜  40% (2)  [Rösta]

Sushi
🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜  60% (3)  [Rösta]
────────────────────────
📊 5 röster · 👤 @pelle

[Avsluta omröstning]
```

**Avslutad omröstning:**
```
🗳️  OMRÖSTNING

Vad ska vi äta till lunch?

✅ Avslutad
────────────────────────
🥈 Pizza
🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜  40% (2)

🥇 Sushi
🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜  60% (3)
────────────────────────
📊 5 röster · 👤 @pelle

[Öppna igen]
```

## Installation

### Från GitHub Releases (rekommenderat)
1. Gå till [Releases](https://github.com/farapholch/omrostning/releases)
2. Ladda ner senaste `omrostning_x.x.x.zip`
3. I Rocket.Chat: Admin → Marketplace → Private Apps → Upload App
4. Välj zip-filen och installera

### Manuell build
```bash
npm install
npx tsc
rc-apps package --experimental-native-compiler
```

## Användning

### Skapa omröstning (modal)
```
/omrostning
```
Öppnar ett formulär där du kan konfigurera:
- Fråga
- Alternativ (2-10 st)
- Röstningstyp (enkel/flerval)
- Anonymitet (öppen/anonym)
- Visa resultat (alltid/efter avslut)
- Tidsgräns (ingen/5min/15min/30min/1h/2h/24h)

### Alias
```
/rost
```

## Röstning

- Klicka **Rösta** för att rösta på ett alternativ
- Klicka igen för att **ångra** din röst
- Vid enkel röst: byter automatiskt till nytt alternativ

## Anonymitet

- **Öppen:** Visar namn på de som röstat under varje alternativ
- **Anonym (🔒):** Visar endast antal röster, inga namn

## Release

Nya versioner byggs automatiskt via GitHub Actions när en tag pushas:

```bash
# Uppdatera version i app.json, sedan:
git add -A && git commit -m "v1.4.0: beskrivning"
git tag v1.4.0
git push && git push origin v1.4.0
```

## Licens

MIT - Team Våffla
