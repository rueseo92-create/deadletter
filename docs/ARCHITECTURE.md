# deadletter — Architecture

## System Overview

```
[User] → iMessage → [Mac Mini] → chat.db
                        ↓
                 message_watcher.py (polling)
                        ↓
                 inbound_filter.py (spam check)
                        ↓
                 crisis_detector.py
                   ↓ (crisis?)
                   ├─ YES → send crisis resources, save as private
                   └─ NO  → ai_handler.py (Claude API)
                              ↓
                        message_sender.py (AppleScript → iMessage reply)
                              ↓
                        anonymizer.py (2-stage PII filter)
                              ↓
                        outbound_filter.py (publish check)
                              ↓
                        letter_publisher.py → letters.json
                              ↓
                        github_pusher.py → GitHub Pages
                              ↓
                        [Web] ← visitors read anonymous letters
```

## Data Flow

1. **Inbound**: User sends iMessage → chat.db polling → message processing
2. **AI Processing**: Message → Claude API → empathetic reply → iMessage back
3. **Anonymization**: Regex (Stage 1) → AI filter (Stage 2) → safe text
4. **Publishing**: Safe letters → JSON → GitHub Pages → public website

## Security

- Phone numbers: SHA-256 hashed, never stored in plain text
- PII: 2-stage filtering (regex + AI)
- Crisis: Auto-detected, never published
- Original messages: Deleted after anonymization
- chat.db: Read-only access (mode=ro)

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Runtime   | Python 3.11+ on macOS         |
| iMessage  | SQLite polling + AppleScript  |
| AI        | Claude API (claude-sonnet)    |
| Database  | SQLite (local)                |
| Web       | Static HTML/CSS/JS            |
| Hosting   | GitHub Pages                  |
| Monitor   | Discord webhooks              |
