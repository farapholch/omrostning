# RocketPoll

A Matterpoll-inspired polling app for Rocket.Chat with real-time updates.

## Features

- **Matterpoll-style layout** - All options as buttons on one row
- **Dynamic options** (2-10) with add/remove buttons
- Single choice or multiple choice voting
- Time limit with auto-close
- Edit poll - modify question, options, vote type, time limit
- Votes cleared when changing vote type (single ↔ multiple)
- Real-time progress bars
- Reopen finished polls (owner only)
- Ranking emojis on completion

## Installation

### From GitHub Releases (recommended)
1. Go to [Releases](https://github.com/farapholch/omrostning/releases)
2. Download the latest `.zip` file
3. In Rocket.Chat: **Admin → Marketplace → Private Apps → Upload App**
4. Select the zip file and install

### Manual build
```bash
npm install
npx tsc
rc-apps package --experimental-native-compiler
```

## Usage

### Commands
| Command | Description |
|---------|-------------|
| `/poll` | Main command |
| `/omröstning` | Swedish alias |
| `/rost` | Short Swedish alias |

### Create poll (modal)
```
/poll
```
Opens a form to configure question, options, vote type, and time limit.

### Quick commands
```
/poll Best animal? cat dog bird
/poll Best animal? | cat | dog | bird
/poll Best animal? cat, dog, bird
```

## Layout

**Active poll:**
```
### Best animal?

[Cat] [Dog] [Bird]
────────────────────────
**Cat**   🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40% (2)
**Dog**   🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60% (3)

Total: 5 votes
[🗑️ Remove vote] [✏️ Edit] [End]
```

**Finished poll:**
```
### Best animal? ✅
────────────────────────
🥇 **Dog**   🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 60% (3)
🥈 **Cat**   🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ 40% (2)

Total: 5 votes
[Reopen]
```

## Voting

- Click an **option button** to vote
- Click again to **remove** your vote
- Single choice: automatically switches to new option

## Release

New versions are built automatically via GitHub Actions when a tag is pushed:

```bash
git tag v2.4.0
git push origin v2.4.0
```

## License

MIT - Team Våffla
