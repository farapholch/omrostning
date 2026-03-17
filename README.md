# Omröstning - Rocket.Chat Poll App

[English](#english) | [Svenska](#svenska)

---

## English

A Matterpoll-inspired polling app for Rocket.Chat with real-time updates.

### Features

- **Matterpoll-style layout** - All options as buttons on one row
- Single choice or multiple choice voting
- Time limit with auto-close (⏰)
- Edit poll - creator can modify question/options (✏️)
- Remove vote - clear your vote (🗑️)
- Real-time progress bars (🟩⬜)
- Reopen finished polls (owner only)
- Ranking emojis on completion (🥇🥈🥉)

### Layout

**Active poll:**
```
### What should we have for lunch?

[Pizza] [Sushi] [Tacos]
────────────────────────
**Pizza**  🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40% (2)
**Sushi**  🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60% (3)

Total: 5 votes
[🗑️ Remove vote] [✏️ Edit] [End]
```

**Finished poll:**
```
### What should we have for lunch?  ✅
────────────────────────
🥇 **Sushi**  🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60% (3)
🥈 **Pizza**  🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40% (2)

Total: 5 votes
[Reopen]
```

### Installation

#### From GitHub Releases (recommended)
1. Go to [Releases](https://github.com/farapholch/omrostning/releases)
2. Download the latest `omrostning_x.x.x.zip`
3. In Rocket.Chat: Admin → Marketplace → Private Apps → Upload App
4. Select the zip file and install

#### Manual build
```bash
npm install
npx tsc
rc-apps package --experimental-native-compiler
```

### Usage

#### Create poll (modal)
```
/omrostning
```
Opens a form to configure:
- Question
- Options (2-10)
- Vote type (single/multiple)
- Show results (always/after end)
- Time limit (none/5min/15min/30min/1h/2h/24h)

#### Quick command
```
/omrostning Question? | Option 1 | Option 2 | Option 3
/omrostning What to eat? Pizza, Sushi, Tacos
```

#### Alias
```
/rost
```

### Voting

- Click an **option button** to vote
- Click again to **remove** your vote
- Single choice: automatically switches to new option

### Release

New versions are built automatically via GitHub Actions when a tag is pushed:

```bash
# Update version in app.json, then:
git add -A && git commit -m v1.x.x: description
git tag v1.x.x
git push && git push origin v1.x.x
```

---

## Svenska

En Matterpoll-inspirerad omröstnings-app för Rocket.Chat med realtids-uppdateringar.

### Funktioner

- **Matterpoll-liknande layout** - Alla alternativ som knappar på en rad
- Enkel röst eller flerval
- Tidsgräns med auto-stängning (⏰)
- Redigera omröstning - skaparen kan ändra fråga/alternativ (✏️)
- Ta bort röst - nollställ din röst (🗑️)
- Realtids progress bars (🟩⬜)
- Öppna igen avslutad omröstning (ägare)
- Ranking-emoji vid avslut (🥇🥈🥉)

### Layout

**Pågående omröstning:**
```
### Vad ska vi äta till lunch?

[Pizza] [Sushi] [Tacos]
────────────────────────
**Pizza**  🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40% (2)
**Sushi**  🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60% (3)

Total: 5 röster
[🗑️ Ta bort röst] [✏️ Redigera] [Avsluta]
```

**Avslutad omröstning:**
```
### Vad ska vi äta till lunch?  ✅
────────────────────────
🥇 **Sushi**  🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60% (3)
🥈 **Pizza**  🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40% (2)

Total: 5 röster
[Öppna igen]
```

### Installation

#### Från GitHub Releases (rekommenderat)
1. Gå till [Releases](https://github.com/farapholch/omrostning/releases)
2. Ladda ner senaste `omrostning_x.x.x.zip`
3. I Rocket.Chat: Admin → Marketplace → Private Apps → Upload App
4. Välj zip-filen och installera

#### Manuell build
```bash
npm install
npx tsc
rc-apps package --experimental-native-compiler
```

### Användning

#### Skapa omröstning (modal)
```
/omrostning
```
Öppnar ett formulär där du kan konfigurera:
- Fråga
- Alternativ (2-10 st)
- Röstningstyp (enkel/flerval)
- Visa resultat (alltid/efter avslut)
- Tidsgräns (ingen/5min/15min/30min/1h/2h/24h)

#### Kortkommando
```
/omrostning Fråga? | Alt 1 | Alt 2 | Alt 3
/omrostning Vad ska vi äta? Pizza, Sushi, Tacos
```

#### Alias
```
/rost
```

### Röstning

- Klicka på en **alternativknapp** för att rösta
- Klicka igen för att **ta bort** din röst
- Vid enkel röst: byter automatiskt till nytt alternativ

### Release

Nya versioner byggs automatiskt via GitHub Actions när en tag pushas:

```bash
# Uppdatera version i app.json, sedan:
git add -A && git commit -m v1.x.x: beskrivning
git tag v1.x.x
git push && git push origin v1.x.x
```

---

## License / Licens

MIT - Team Våffla
