## 🚀 Development Setup

Diese Anleitung beschreibt, wie das Spoolman Backend sowie das Frontend lokal gestartet werden.

---

## 🖥️ Backend starten

### 1. Environment vorbereiten

export SPOOLMAN_DEBUG_MODE=TRUE
export SPOOLMAN_PRINT_REQUEST_PASSWORD=mein_test_passwort
export SPOOLMAN_PRINT_REQUEST_COOKIE_SECRET=stricken-moisten-carving-exonerate-crazed-wasting-bankbook-granola-detector-drainable

### 2. Abhängigkeiten installieren

uv sync

### 3. Backend starten

uv run python -m spoolman.main

### Ergebnis

Das Backend ist erreichbar unter:

http://localhost:8000

API-Endpunkte:

http://localhost:8000/api/v1

---

## 🌐 Frontend starten (Spoolman UI)

### 1. In das Frontend-Verzeichnis wechseln

cd spoolman/client

### 2. Abhängigkeiten installieren

npm install

### 3. `.env` Datei erstellen

Datei: spoolman/client/.env

Inhalt:

VITE_APIURL=http://localhost:8000/api/v1

### 4. Frontend starten

npm run dev

### Ergebnis

Das Frontend ist erreichbar unter:

http://localhost:5173

---

## ⚙️ Optionale Einstellungen

Für lokale Entwicklung kann der Debug-Modus im Backend aktiviert werden:

export SPOOLMAN_DEBUG_MODE=TRUE

Optional (für Proxy-Setup):

export FORWARDED_ALLOW_IPS=*

---

## 🧪 Hinweise

- Backend muss laufen, bevor das Frontend gestartet wird
- Änderungen im Backend erfordern ggf. einen Neustart
- Änderungen im Frontend werden automatisch neu geladen (Hot Reload)