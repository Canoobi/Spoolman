# Spoolman

## Übersicht

Spoolman ist ein Webservice zur Verwaltung von 3D-Druck-Filamentspulen. Die Anwendung bietet eine REST-API sowie eine Web-Oberfläche, um Spulen, Filamente, Hersteller und Drucker zu verwalten. Zusätzlich enthält das Projekt ein öffentliches Druckauftrags-Portal (Public Print Request) und eine Kostenkalkulationsfunktion.

## Projektstatus

| Feld | Wert |
|------|------|
| Status | Aktiv |
| Stabilität | Stabil |
| Produktiv nutzbar | Ja |
| Letzte bekannte Änderung | Noch nicht dokumentiert |
| Offene Hauptaufgaben | Noch nicht dokumentiert |

## Metadaten

| Feld | Wert |
|------|------|
| Projektname | `Spoolman` |
| Repository-URL | https://github.com/Canoobi/Spoolman |
| Version | 0.22.1 |
| Lizenz | MIT |

## Technologie-Stack

| Bereich | Technologie | Zweck |
|---------|-------------|-------|
| Sprache (Backend) | Python 3.9–3.12 | Backend-Logik und API |
| Sprache (Frontend) | TypeScript / React | Admin-Web-UI (Spoolman Client) |
| Sprache (Public Print Request) | TypeScript / React 19 | Öffentliches Auftragsformular |
| Framework (Backend) | FastAPI ~0.115 | REST-API und WebSocket-Server |
| ORM | SQLAlchemy ~2.0 | Datenbankzugriff (async) |
| Datenbank-Migrationen | Alembic ~1.15 | Schema-Migrationen |
| Datenbank | SQLite / PostgreSQL / MySQL / CockroachDB | Persistenz (konfigurierbar) |
| Frontend-Framework | React 18, Ant Design, Refine | Admin-UI |
| Frontend (Public) | React 19, Ant Design 6 | Öffentliches Portal |
| Build-Tool (Frontend) | Vite | Bundling |
| Runtime | uvicorn | ASGI-Server |
| Paketmanager (Python) | PDM / uv | Dependency-Management |
| Paketmanager (Frontend) | npm | Frontend-Dependencies |
| Monitoring | Prometheus (prometheus-client) | Metriken |
| Deployment | Docker | Containerisierung |
| Linting | Ruff, Black | Code-Qualität |
| Testing | pytest, pytest-asyncio | Integrationstests |

## Dependencies

### Backend (Python)

| Dependency | Zweck |
|------------|-------|
| `fastapi` | REST-API-Framework |
| `uvicorn` | ASGI-Server |
| `SQLAlchemy` | ORM mit async-Unterstützung |
| `alembic` | Datenbank-Migrationen |
| `pydantic` | Datenvalidierung und Serialisierung |
| `asyncpg` | Async PostgreSQL-Treiber |
| `psycopg2-binary` | PostgreSQL-Treiber (synchron, für Alembic) |
| `sqlalchemy-cockroachdb` | CockroachDB-Dialekt |
| `prometheus-client` | Prometheus-Metriken |
| `httpx` | HTTP-Client für externe Anfragen |
| `hishel` | HTTP-Caching |
| `Pillow` | Bildgenerierung (Label-Erstellung) |
| `qrcode` | QR-Code-Generierung für Labels |
| `scheduler` | Hintergrund-Aufgabenplanung |
| `platformdirs` | Plattformspezifische Verzeichnisse |
| `WebSockets` | WebSocket-Unterstützung |
| `tzdata` | Zeitzonen-Daten |

### Frontend (Spoolman Client)

| Dependency | Zweck |
|------------|-------|
| `react` / `react-dom` | UI-Rendering |
| `antd` | UI-Komponenten |
| `@refinedev/antd` | CRUD-Framework für React |
| `axios` | HTTP-Client |
| `react-router-dom` | Routing |
| `i18next` | Internationalisierung |
| `zustand` | State-Management |

### Dev-Dependencies (Python)

| Dependency | Zweck |
|------------|-------|
| `ruff` | Linter |
| `black` | Code-Formatter |
| `pre-commit` | Pre-Commit-Hooks |
| `pytest` | Test-Framework |
| `pytest-asyncio` | Async-Tests |
| `httpx` | Test-HTTP-Client |

## Projektstruktur

```text
Spoolman/
├── spoolman/                  # Python-Backend (FastAPI)
│   ├── api/v1/                # API-Endpunkte (Router, Models)
│   ├── database/              # SQLAlchemy-Modelle und DB-Operationen
│   ├── prometheus/            # Prometheus-Metriken
│   ├── main.py                # Anwendungs-Einstiegspunkt
│   ├── env.py                 # Umgebungsvariablen-Verwaltung
│   ├── settings.py            # Einstellungsdefinitionen
│   ├── ws.py                  # WebSocket-Manager
│   ├── export.py              # Export-Logik (CSV/JSON)
│   ├── externaldb.py          # Externe Filament-Datenbank
│   └── extra_fields.py        # Benutzerdefinierte Felder
├── client/                    # Frontend (React/TypeScript)
│   ├── src/                   # Quellcode
│   ├── public/                # Statische Assets
│   └── package.json           # Frontend-Dependencies
├── public-print-request/      # Öffentliches Druckauftrags-Portal
│   ├── src/                   # Quellcode (React 19)
│   ├── nginx.conf             # Nginx-Konfiguration
│   └── Dockerfile             # Separater Container
├── migrations/                # Alembic-Migrationen
│   └── versions/              # Einzelne Migrationsdateien
├── tests_integration/         # Integrationstests
│   └── tests/                 # Testdateien
├── scripts/                   # Hilfsskripte
├── docker-compose.yml         # Docker-Compose-Konfiguration
├── Dockerfile                 # Multi-Stage-Build
├── entrypoint.sh              # Container-Entrypoint
├── pyproject.toml             # Python-Projektdefinition (PDM)
├── alembic.ini                # Alembic-Konfiguration
├── .env.example               # Beispiel-Umgebungsvariablen
└── .pre-commit-config.yaml    # Pre-Commit-Konfiguration
```

**Einstiegspunkt:** `spoolman/main.py` – startet FastAPI mit uvicorn und mountet die API sowie das statische Frontend.

**API-Routen:** `spoolman/api/v1/` – jede Ressource hat eine eigene Datei (filament.py, spool.py, vendor.py, etc.).

**Datenmodelle:** `spoolman/database/models.py` – SQLAlchemy-ORM-Modelle.

**Konfiguration:** `spoolman/env.py` – liest alle Umgebungsvariablen.

**Tests:** `tests_integration/` – Docker-basierte Integrationstests gegen verschiedene Datenbanken.

## Architektur

| Komponente | Aufgabe | Technologie |
|------------|---------|-------------|
| Backend (API) | REST-API, WebSocket, Geschäftslogik | FastAPI, SQLAlchemy, uvicorn |
| Frontend (Client) | Admin-Oberfläche zur Verwaltung | React 18, Ant Design, Refine |
| Public Print Request | Öffentliches Auftragsformular | React 19, Ant Design 6, Nginx |
| Datenbank | Persistenz | SQLite / PostgreSQL / MySQL / CockroachDB |
| Externe DB | Filament-Referenzdaten | SpoolmanDB (GitHub Pages) |
| Monitoring | Metriken | Prometheus |

```text
┌────────────────────────┐     ┌──────────────────────────┐
│  Spoolman Client (SPA) │     │ Public Print Request SPA │
│  React / Ant Design    │     │ React 19 / Nginx         │
└──────────┬─────────────┘     └──────────┬───────────────┘
           │ HTTP/WS                       │ HTTP
           ▼                               ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI Backend (uvicorn)                    │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │ REST API   │  │ WebSocket  │  │ Prometheus /metrics│  │
│  │ /api/v1/   │  │ Echtzeit   │  │                   │  │
│  └─────┬──────┘  └────────────┘  └───────────────────┘  │
│        │                                                  │
│  ┌─────▼──────────────────────────────────────────────┐  │
│  │         SQLAlchemy (async) + Alembic               │  │
│  └─────┬──────────────────────────────────────────────┘  │
└────────┼─────────────────────────────────────────────────┘
         ▼
┌────────────────────┐     ┌────────────────────────┐
│     Datenbank      │     │   Externe SpoolmanDB   │
│ SQLite/PG/MySQL/CR │     │   (Filament-Katalog)   │
└────────────────────┘     └────────────────────────┘
```

## Datenfluss

```text
Client (Browser) ──HTTP/WS──► FastAPI ──► SQLAlchemy ──► Datenbank
                                  │
                                  ├──► WebSocket-Broadcast an verbundene Clients
                                  │
                                  └──► Externe SpoolmanDB (periodischer Sync)
```

1. Der Client (Browser) sendet HTTP-Anfragen an die REST-API unter `/api/v1/`.
2. FastAPI validiert die Anfrage über Pydantic-Modelle.
3. Die Geschäftslogik in den Datenbankmodulen führt CRUD-Operationen über SQLAlchemy aus.
4. Bei Änderungen wird ein WebSocket-Event an alle verbundenen Clients gesendet.
5. Regelmäßig wird die externe SpoolmanDB synchronisiert (Filamente, Materialien).
6. Der Client rendert die Antwortdaten in der UI.

**Fehlerfälle:**
- Ressource nicht gefunden → HTTP 404 mit JSON-Nachricht
- Validierungsfehler → HTTP 400/422 mit Fehlerbeschreibung
- Datenbankfehler → HTTP 500, wird geloggt

## Datenmodell

### Vendor (Hersteller)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | Integer | Ja (auto) | Primärschlüssel |
| registered | DateTime | Ja | Registrierungszeitpunkt |
| name | String(64) | Ja | Herstellername |
| empty_spool_weight | Float | Nein | Gewicht einer leeren Spule (g) |
| comment | String(1024) | Nein | Kommentar |
| external_id | String(256) | Nein | ID aus externer Datenbank |

### Filament

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | Integer | Ja (auto) | Primärschlüssel |
| registered | DateTime | Ja | Registrierungszeitpunkt |
| name | String(64) | Nein | Filamentname |
| vendor_id | FK → Vendor | Nein | Hersteller |
| material | String(64) | Nein | Material (PLA, ABS, etc.) |
| price | Float | Nein | Preis |
| density | Float | Ja | Dichte (g/cm³) |
| diameter | Float | Ja | Durchmesser (mm) |
| weight | Float | Nein | Netto-Filamentgewicht (g) |
| spool_weight | Float | Nein | Leer-Spulengewicht (g) |
| article_number | String(64) | Nein | Artikelnummer |
| color_hex | String(8) | Nein | Farbcode |
| multi_color_hexes | String(128) | Nein | Mehrfarbcodes |
| settings_extruder_temp | Integer | Nein | Extruder-Temperatur |
| settings_bed_temp | Integer | Nein | Bett-Temperatur |

### Spool (Spule)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | Integer | Ja (auto) | Primärschlüssel |
| registered | DateTime | Ja | Registrierungszeitpunkt |
| first_used | DateTime | Nein | Erste Nutzung |
| last_used | DateTime | Nein | Letzte Nutzung |
| filament_id | FK → Filament | Ja | Zugehöriges Filament |
| initial_weight | Float | Nein | Anfangsgewicht (g) |
| spool_weight | Float | Nein | Spulengewicht (g) |
| used_weight | Float | Ja | Verbrauchtes Gewicht (g) |
| location | String(64) | Nein | Lagerort |
| lot_nr | String(64) | Nein | Chargennummer |
| archived | Boolean | Nein | Archiviert-Flag |

### Printer (Drucker)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | Integer | Ja (auto) | Primärschlüssel |
| registered | DateTime | Ja | Registrierungszeitpunkt |
| name | String(128) | Ja | Druckername |
| power_watts | Float | Nein | Leistungsaufnahme (Watt) |
| depreciation_cost_per_hour | Float | Nein | Abschreibung pro Stunde |
| comment | String(1024) | Nein | Kommentar |

### CostCalculation (Kostenkalkulation)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | Integer | Ja (auto) | Primärschlüssel |
| created | DateTime | Ja | Erstellungszeitpunkt |
| printer_id | FK → Printer | Nein | Zugehöriger Drucker |
| filament_id | FK → Filament | Nein | Verwendetes Filament |
| print_time_hours | Float | Nein | Druckzeit (Stunden) |
| filament_weight_g | Float | Nein | Filamentverbrauch (g) |
| material_cost | Float | Nein | Materialkosten |
| energy_cost | Float | Nein | Energiekosten |
| final_price | Float | Nein | Endpreis |
| paid | Boolean | Ja | Bezahlt-Status |
| print_request_id | FK → PrintRequest | Nein | Zugehöriger Druckauftrag |

### PrintRequest (Druckauftrag)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | Integer | Ja (auto) | Primärschlüssel |
| public_id | String(64) | Ja | Öffentliche ID |
| requester_name | String(128) | Ja | Name des Auftraggebers |
| title | String(256) | Ja | Auftragsbezeichnung |
| description | Text | Ja | Beschreibung |
| status | String(32) | Ja | Status (pending, accepted, rejected, completed) |
| wanted_date | DateTime | Nein | Wunschdatum |
| priority | String(16) | Nein | Priorität |

### Beziehungen

- Vendor 1:n Filament
- Filament 1:n Spool
- Printer 1:n CostCalculation
- PrintRequest 1:1 CostCalculation
- PrintRequest n:m Filament (über PrintRequestFilament)
- Vendor/Filament/Spool haben jeweils Extra-Fields (Key-Value)

## Features

| Feature | Beschreibung | Status |
|---------|--------------|--------|
| Spulenverwaltung | CRUD für Filamentspulen mit Gewichtstracking | Fertig |
| Filamentverwaltung | CRUD für Filamenttypen mit Farbe, Material, Dichte | Fertig |
| Herstellerverwaltung | CRUD für Hersteller | Fertig |
| Druckerverwaltung | CRUD für 3D-Drucker | Fertig |
| Kostenkalkulation | Berechnung von Druckkosten (Material, Energie, Abschreibung) | Fertig |
| Druckaufträge | Öffentliches Portal für Druckauftrags-Einreichung | Fertig |
| WebSocket-Updates | Echtzeit-Benachrichtigungen bei Datenänderungen | Fertig |
| Externe Filament-DB | Synchronisation mit SpoolmanDB-Katalog | Fertig |
| Export | Export von Spulen, Filamenten, Herstellern als CSV/JSON | Fertig |
| Extra-Felder | Benutzerdefinierte Felder pro Entität | Fertig |
| Prometheus-Metriken | Monitoring-Endpunkt `/metrics` | Fertig |
| Automatische Backups | Nächtliche SQLite-Backups | Fertig |
| Mehrere Datenbanken | SQLite, PostgreSQL, MySQL, CockroachDB | Fertig |
| Internationalisierung | Frontend mit i18next | Fertig |
| QR-Code-Scanner | Spulen per QR-Code identifizieren | Fertig |
| NIIMBOT-Label-Druck | Druckfertiges Label (50×30 mm) für NIIMBOT B1 Pro Etikettendrucker | Fertig |

## API-Endpunkte

Basis-Pfad: `/api/v1`

### Allgemein

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/info` | Allgemeine API-Informationen | Nein |
| GET | `/api/v1/health` | Health-Check | Nein |
| POST | `/api/v1/backup` | Datenbank-Backup auslösen (nur SQLite) | Nein |
| GET | `/metrics` | Prometheus-Metriken | Nein |
| WS | `/api/v1/` | WebSocket für alle Datenänderungen | Nein |

### Vendor (Hersteller)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/vendor` | Hersteller suchen/auflisten | Nein |
| GET | `/api/v1/vendor/{vendor_id}` | Einzelnen Hersteller abrufen | Nein |
| POST | `/api/v1/vendor` | Hersteller erstellen | Nein |
| PATCH | `/api/v1/vendor/{vendor_id}` | Hersteller aktualisieren | Nein |
| DELETE | `/api/v1/vendor/{vendor_id}` | Hersteller löschen | Nein |
| WS | `/api/v1/vendor` | WebSocket für Hersteller-Änderungen | Nein |
| WS | `/api/v1/vendor/{vendor_id}` | WebSocket für einzelnen Hersteller | Nein |

### Filament

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/filament` | Filamente suchen/auflisten | Nein |
| GET | `/api/v1/filament/{filament_id}` | Einzelnes Filament abrufen | Nein |
| POST | `/api/v1/filament` | Filament erstellen | Nein |
| PATCH | `/api/v1/filament/{filament_id}` | Filament aktualisieren | Nein |
| DELETE | `/api/v1/filament/{filament_id}` | Filament löschen | Nein |
| WS | `/api/v1/filament` | WebSocket für Filament-Änderungen | Nein |
| WS | `/api/v1/filament/{filament_id}` | WebSocket für einzelnes Filament | Nein |

### Spool (Spule)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/spool` | Spulen suchen/auflisten | Nein |
| GET | `/api/v1/spool/{spool_id}` | Einzelne Spule abrufen | Nein |
| POST | `/api/v1/spool` | Spule erstellen | Nein |
| PATCH | `/api/v1/spool/{spool_id}` | Spule aktualisieren | Nein |
| DELETE | `/api/v1/spool/{spool_id}` | Spule löschen | Nein |
| PUT | `/api/v1/spool/{spool_id}/use` | Filamentverbrauch erfassen | Nein |
| PUT | `/api/v1/spool/{spool_id}/measure` | Spulengewicht messen/setzen | Nein |
| WS | `/api/v1/spool` | WebSocket für Spulen-Änderungen | Nein |
| WS | `/api/v1/spool/{spool_id}` | WebSocket für einzelne Spule | Nein |

### Printer (Drucker)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/printer` | Drucker suchen/auflisten | Nein |
| GET | `/api/v1/printer/{printer_id}` | Einzelnen Drucker abrufen | Nein |
| POST | `/api/v1/printer` | Drucker erstellen | Nein |
| PATCH | `/api/v1/printer/{printer_id}` | Drucker aktualisieren | Nein |
| DELETE | `/api/v1/printer/{printer_id}` | Drucker löschen | Nein |
| WS | `/api/v1/printer` | WebSocket für Drucker-Änderungen | Nein |
| WS | `/api/v1/printer/{printer_id}` | WebSocket für einzelnen Drucker | Nein |

### Cost Calculation (Kostenkalkulation)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/cost` | Kostenkalkulationen suchen/auflisten | Nein |
| GET | `/api/v1/cost/{cost_id}` | Einzelne Kalkulation abrufen | Nein |
| POST | `/api/v1/cost` | Kostenkalkulation erstellen | Nein |
| PATCH | `/api/v1/cost/{cost_id}` | Kostenkalkulation aktualisieren | Nein |
| DELETE | `/api/v1/cost/{cost_id}` | Kostenkalkulation löschen | Nein |
| WS | `/api/v1/cost` | WebSocket für Kalkulationsänderungen | Nein |
| WS | `/api/v1/cost/{cost_id}` | WebSocket für einzelne Kalkulation | Nein |

### Print Request (Druckaufträge)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/print-request` | Druckaufträge auflisten | Nein |
| GET | `/api/v1/print-request/{request_id}` | Einzelnen Auftrag abrufen | Nein |
| PATCH | `/api/v1/print-request/{request_id}` | Auftrag intern bearbeiten | Nein |
| POST | `/api/v1/print-request/{request_id}/accept` | Auftrag annehmen | Nein |
| POST | `/api/v1/print-request/{request_id}/reject` | Auftrag ablehnen | Nein |
| GET | `/api/v1/print-request/{request_id}/label` | NIIMBOT-Label als PNG generieren | Nein |

### Print Request Public (Öffentliches Portal)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| POST | `/api/v1/print-request-public/login` | Login mit Passwort/Nutzer | Ja (Passwort) |
| POST | `/api/v1/print-request-public/logout` | Logout | Nein |
| GET | `/api/v1/print-request-public/form-data` | Formulardaten abrufen | Ja (Session) |
| POST | `/api/v1/print-request-public/` | Druckauftrag einreichen | Ja (Session) |
| GET | `/api/v1/print-request-public/{public_id}` | Eigenen Auftrag abrufen | Ja (Session) |
| PATCH | `/api/v1/print-request-public/{public_id}` | Eigenen Auftrag bearbeiten | Ja (Session) |
#### Label-Endpunkt Details

**GET** `/api/v1/print-request/{request_id}/label`

Generiert ein druckfertiges PNG-Label für NIIMBOT B1 Pro Etikettendrucker. Interner Endpunkt, erreichbar über die Admin-Oberfläche.

**Parameter:**

| Parameter | Typ | In | Pflicht | Beschreibung |
|-----------|-----|-----|---------|--------------|
| `request_id` | integer | path | Ja | Interne ID des Druckauftrags |
| `base_url` | string | query | Nein | Basis-URL für den QR-Code (Standard: `https://canoob.de`) |

**Label-Spezifikation:**

| Eigenschaft | Wert |
|-------------|------|
| Größe | 50 mm × 30 mm |
| Auflösung | 300 DPI (~591 × 354 px) |
| Farbmodus | Schwarz-Weiß (1-bit, als Grayscale-PNG gespeichert) |
| Format | PNG |

**Label-Layout:**

```text
┌──────────────────────┬─────────────────────┐
│ #42                  │                     │
│ ─────────────────────│                     │
│ Mein langer Titel    │                     │
│ über mehrere Zeilen  │      QR-Code        │
│ Bestelldatum         │                     │
│ 10.06.2026           │                     │
│ Fertigstellung       │                     │
│ 15.06.2026           │                     │
│ Preis                │                     │
│ 12.50 EUR            │                     │
└──────────────────────┴─────────────────────┘
        50 %                    50 %
```

- Linke Hälfte: Request-ID, Titel (1–4 Zeilen, Wortumbruch bei Leerzeichen/Bindestrich), Bestelldatum, Fertigstellung, Preis (unten)
- Rechte Hälfte: QR-Code zur öffentlichen Request-URL (vertikal zentriert)
- Trennlinie unter der ID geht bis zur halben Labelbreite
- Preis zeigt „Kostenlos" wenn 0 oder nicht vorhanden

**Response:** `200 OK` mit `Content-Type: image/png` und `Content-Disposition: attachment; filename="request-{request_id}-label.png"`

**Fehlerfälle:**

| Status | Beschreibung |
|--------|--------------|
| 404 | Auftrag nicht gefunden |
| 500 | Pillow oder qrcode nicht installiert |

### Setting (Einstellungen)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/setting/` | Alle Einstellungen abrufen | Nein |
| GET | `/api/v1/setting/{key}` | Einzelne Einstellung abrufen | Nein |
| POST | `/api/v1/setting/{key}` | Einstellung setzen/zurücksetzen | Nein |
| WS | `/api/v1/setting` | WebSocket für Einstellungsänderungen | Nein |
| WS | `/api/v1/setting/{key}` | WebSocket für einzelne Einstellung | Nein |

### Field (Extra-Felder)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/field/{entity_type}` | Extra-Felder einer Entität abrufen | Nein |
| POST | `/api/v1/field/{entity_type}/{key}` | Extra-Feld anlegen/aktualisieren | Nein |
| DELETE | `/api/v1/field/{entity_type}/{key}` | Extra-Feld löschen | Nein |

### Other (Hilfsdaten)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/material` | Alle Materialien auflisten | Nein |
| GET | `/api/v1/article-number` | Alle Artikelnummern auflisten | Nein |
| GET | `/api/v1/lot-number` | Alle Chargennummern auflisten | Nein |
| GET | `/api/v1/location` | Alle Lagerorte auflisten | Nein |
| PATCH | `/api/v1/location/{location}` | Lagerort umbenennen | Nein |

### External DB (Externe Datenbank)

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/external/filament` | Externe Filamente abrufen | Nein |
| GET | `/api/v1/external/material` | Externe Materialien abrufen | Nein |

### Export

| Methode | Pfad | Beschreibung | Auth erforderlich |
|---------|------|--------------|-------------------|
| GET | `/api/v1/export/spools?fmt=csv\|json` | Spulen exportieren | Nein |
| GET | `/api/v1/export/filaments?fmt=csv\|json` | Filamente exportieren | Nein |
| GET | `/api/v1/export/vendors?fmt=csv\|json` | Hersteller exportieren | Nein |

## Commands / CLI / Bot-Befehle

| Command | Beschreibung | Ausführung |
|---------|--------------|------------|
| `pdm run app` | Backend starten (uvicorn) | `uvicorn spoolman.main:app` |
| `pdm run docs` | API-Dokumentation generieren | `spoolman.docs:generate_docs` |
| `pdm run bump` | Version erhöhen | `spoolman.bump:bump` |
| `pdm run itest` | Integrationstests starten | `python tests_integration/run.py` |

## Konfiguration

Die Konfiguration erfolgt ausschließlich über Umgebungsvariablen. Eine `.env.example`-Datei ist im Repository enthalten.

### Datenbankkonfiguration

Standardmäßig wird SQLite verwendet. Für PostgreSQL, MySQL oder CockroachDB müssen zusätzliche Variablen gesetzt werden (Host, Port, Name, Benutzername, Passwort).

### Docker-Konfiguration

Der Docker-Container verwendet Port 8000 intern und kann über `SPOOLMAN_PORT` und `SPOOLMAN_HOST` angepasst werden. Die User-ID im Container ist über `PUID`/`PGID` steuerbar.

## Umgebungsvariablen

| Variable | Zweck | Beispielwert | Pflichtfeld |
|----------|-------|--------------|-------------|
| `SPOOLMAN_DB_TYPE` | Datenbanktyp | `sqlite` | Nein (Standard: sqlite) |
| `SPOOLMAN_DB_HOST` | Datenbank-Host | `YOUR_DB_HOST_HERE` | Nur bei externem DB |
| `SPOOLMAN_DB_PORT` | Datenbank-Port | `5432` | Nur bei externem DB |
| `SPOOLMAN_DB_NAME` | Datenbankname | `spoolman` | Nur bei externem DB |
| `SPOOLMAN_DB_USERNAME` | DB-Benutzername | `YOUR_DB_USERNAME_HERE` | Nur bei externem DB |
| `SPOOLMAN_DB_PASSWORD` | DB-Passwort | `YOUR_DB_PASSWORD_HERE` | Nur bei externem DB |
| `SPOOLMAN_DB_PASSWORD_FILE` | Pfad zur Passwortdatei | `/run/secrets/db_password` | Nein |
| `SPOOLMAN_DB_QUERY` | DB-Query-Parameter | `unix_socket=/path/to/mysql.sock` | Nein |
| `SPOOLMAN_HOST` | Listen-Host | `0.0.0.0` | Nein (Standard: 0.0.0.0) |
| `SPOOLMAN_PORT` | Listen-Port | `7912` | Nein (Standard: 8000 im Docker) |
| `SPOOLMAN_LOGGING_LEVEL` | Log-Level | `INFO` | Nein (Standard: INFO) |
| `SPOOLMAN_DEBUG_MODE` | Debug-Modus | `FALSE` | Nein (Standard: FALSE) |
| `SPOOLMAN_AUTOMATIC_BACKUP` | Auto-Backup (SQLite) | `TRUE` | Nein (Standard: TRUE) |
| `SPOOLMAN_DIR_DATA` | Datenverzeichnis | `/home/app/.local/share/spoolman` | Nein |
| `SPOOLMAN_DIR_BACKUPS` | Backup-Verzeichnis | `/path/to/backups` | Nein |
| `SPOOLMAN_DIR_LOGS` | Log-Verzeichnis | `/path/to/logs` | Nein |
| `SPOOLMAN_BASE_PATH` | Sub-Pfad für Hosting | `/spoolman` | Nein |
| `SPOOLMAN_METRICS_ENABLED` | Prometheus-Metriken aktivieren | `FALSE` | Nein (Standard: FALSE) |
| `SPOOLMAN_CORS_ORIGIN` | Erlaubte CORS-Origins | `*` | Nein |
| `EXTERNAL_DB_URL` | URL der externen Filament-DB | `https://donkie.github.io/SpoolmanDB/` | Nein |
| `EXTERNAL_DB_SYNC_INTERVAL` | Sync-Intervall (Sekunden) | `3600` | Nein (Standard: 3600) |
| `PUID` | User-ID im Container | `1000` | Nein (Standard: 1000) |
| `PGID` | Group-ID im Container | `1000` | Nein (Standard: 1000) |
| `SPOOLMAN_PRINT_REQUEST_PASSWORD` | Passwort für öffentliches Portal | `YOUR_PASSWORD_HERE` | Nein |
| `SPOOLMAN_PRINT_REQUEST_USER_PASSWORDS` | Nutzer-Passwörter (JSON) | `{"Alice":"secret1"}` | Nein |
| `SPOOLMAN_PRINT_REQUEST_COOKIE_SECRET` | Cookie-Signatur-Secret | `YOUR_SECRET_HERE` | Ja (für Print Requests) |
| `SPOOLMAN_PRINT_REQUEST_TIMEZONE` | Zeitzone für Aufträge | `Europe/Berlin` | Nein (Standard: UTC) |
| `TZ` | Container-Zeitzone | `Europe/Berlin` | Nein |

## Konfigurationsdateien

| Datei | Zweck | Muss angepasst werden |
|-------|-------|----------------------|
| `.env.example` | Beispiel-Umgebungsvariablen | Ja (als `.env` kopieren) |
| `docker-compose.yml` | Container-Definition | Ja (Volumes, Ports) |
| `alembic.ini` | Alembic-Migrationskonfiguration | Nein |
| `pyproject.toml` | Projektdefinition, Dependencies, Linting | Nein |
| `.pre-commit-config.yaml` | Pre-Commit-Hook-Konfiguration | Nein |
| `client/package.json` | Frontend-Dependencies und Scripts | Nein |

## Schnellstart

### Docker (empfohlen)

```bash
git clone https://github.com/Canoobi/Spoolman.git
cd Spoolman
cp .env.example .env
# .env nach Bedarf anpassen
docker compose up -d --build
```

Die Anwendung ist erreichbar unter: `http://localhost:30168`

### Lokale Entwicklung

```bash
git clone https://github.com/Canoobi/Spoolman.git
cd Spoolman
cp .env.example .env
uv sync
uv run python -m spoolman.main
```

Backend erreichbar unter: `http://localhost:8000`

## Installation

### Voraussetzungen

- Python 3.9–3.12
- Node.js 20.x (für Frontend-Build)
- PDM oder uv (Python-Paketmanager)
- Docker und Docker Compose (für Container-Betrieb)

### Backend

```bash
# Mit uv (empfohlen)
uv sync

# Oder mit PDM
pdm install
```

### Frontend (Client)

```bash
cd client
npm install
```

### Public Print Request

```bash
cd public-print-request
npm install
```

## Lokale Entwicklung

### Backend starten

```bash
export SPOOLMAN_DEBUG_MODE=TRUE
export SPOOLMAN_PRINT_REQUEST_TIMEZONE=Europe/Berlin
export SPOOLMAN_PRINT_REQUEST_PASSWORD=YOUR_PASSWORD_HERE
export SPOOLMAN_PRINT_REQUEST_COOKIE_SECRET=YOUR_SECRET_HERE
uv run python -m spoolman.main
```

Backend ist erreichbar unter: `http://localhost:8000`  
API-Dokumentation (OpenAPI): `http://localhost:8000/api/v1/docs`

### Frontend starten

```bash
cd client
# .env erstellen mit:
# VITE_APIURL=http://localhost:8000/api/v1
npm run dev
```

Frontend ist erreichbar unter: `http://localhost:5173`

### Public Print Request starten

```bash
cd public-print-request
npm run dev
```

### Hinweise

- Backend muss laufen, bevor das Frontend gestartet wird.
- Änderungen im Backend erfordern einen Neustart.
- Änderungen im Frontend werden per Hot Reload automatisch geladen.
- Für lokale Entwicklung `SPOOLMAN_DEBUG_MODE=TRUE` setzen, damit CORS für `localhost:5173` erlaubt ist.

## Build

| Befehl | Zweck |
|--------|-------|
| `cd client && npm run build` | Frontend-Produktionsbuild erstellen |
| `cd public-print-request && npm run build` | Public Print Request Build |
| `docker compose build` | Docker-Image erstellen |

Der Dockerfile nutzt einen Multi-Stage-Build:
1. Stage `client-builder`: Frontend wird mit Node.js 20 gebaut.
2. Stage `python-builder`: Python-Dependencies werden mit PDM installiert.
3. Stage `python-runner`: Schlankes Produktions-Image.

## Tests

| Testtyp | Befehl | Beschreibung |
|---------|--------|--------------|
| Integrationstests | `pdm run itest` | Docker-basierte Tests gegen SQLite, PostgreSQL, MariaDB, CockroachDB |

### Testframework

- pytest + pytest-asyncio
- Integrationstests laufen in separaten Docker-Containern (siehe `tests_integration/`)
- Separate Docker-Compose-Dateien je Datenbanktyp

### Testdateien

```text
tests_integration/
├── tests/                # Testdateien
├── docker-compose-sqlite.yml
├── docker-compose-postgres.yml
├── docker-compose-mariadb.yml
├── docker-compose-cockroachdb.yml
├── Dockerfile
└── run.py               # Test-Runner
```

## Deployment

### Docker Compose

```yaml
services:
  spoolman:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    volumes:
      - ./data:/home/app/.local/share/spoolman
    ports:
      - "8000:8000"
    environment:
      - TZ=Europe/Berlin
```

**Wichtig:** Das Datenverzeichnis `/home/app/.local/share/spoolman` muss als Volume gemountet werden, da sonst die Datenbank beim Container-Stopp verloren geht.

### Ports

| Service | Container-Port | Beschreibung |
|---------|---------------|--------------|
| Spoolman Backend | 8000 | REST-API + Frontend |
| Public Print Request | 80 | Nginx-basiertes Portal |

## CI/CD

--

## Sicherheit

- Das Public Print Request Portal ist durch Passwort-Authentifizierung geschützt (`SPOOLMAN_PRINT_REQUEST_PASSWORD` oder nutzerspezifische Passwörter via `SPOOLMAN_PRINT_REQUEST_USER_PASSWORDS`).
- Sessions werden per signiertem Cookie verwaltet (`SPOOLMAN_PRINT_REQUEST_COOKIE_SECRET`).
- CORS ist konfigurierbar; im Debug-Modus werden nur localhost-Origins erlaubt.
- Die interne API hat keine Authentifizierung – der Zugriff sollte über Netzwerk/Reverse-Proxy eingeschränkt werden.
- Passwörter können über Datei-Pfad bereitgestellt werden (`SPOOLMAN_DB_PASSWORD_FILE`).
- Der Container läuft standardmäßig nicht als Root (su-exec mit konfigurierbarer UID/GID).

## Logging / Monitoring

- **Logging:** Konfigurierbar über `SPOOLMAN_LOGGING_LEVEL` (DEBUG, INFO, WARNING, ERROR, CRITICAL). Logs werden in die Konsole und rotierend in `spoolman.log` geschrieben (5 Tage Rotation).
- **Monitoring:** Prometheus-Metriken unter `/metrics` abrufbar (aktivierbar über `SPOOLMAN_METRICS_ENABLED=TRUE`).
- **Log-Verzeichnis:** Konfigurierbar über `SPOOLMAN_DIR_LOGS`.

## Fehlerbehandlung

- `ItemNotFoundError` → HTTP 404 mit JSON-Fehlernachricht
- Pydantic-Validierungsfehler → HTTP 422 mit Felddetails
- Manuelle Validierungsfehler → HTTP 400 mit Nachricht
- Datenbankfehler → HTTP 500, geloggt
- WebSocket-Disconnect → Verbindung wird sauber entfernt

## Bekannte Limitierungen / Offene Punkte

- Die interne API hat keine Authentifizierung/Autorisierung – nur für vertrauenswürdige Netzwerke geeignet.
- Automatische Backups funktionieren nur mit SQLite.
- Alembic-Migrationen werden beim Start als Subprocess ausgeführt (Workaround für uvicorn-Worker-Hanging).
- `requires-python` ist auf 3.9–3.12 beschränkt.

## Wartung und Erweiterung

- **Neue Entität hinzufügen:** Modell in `database/models.py`, DB-Modul in `database/`, API-Router in `api/v1/`, Alembic-Migration erstellen.
- **Migration erstellen:** `alembic revision --autogenerate -m "Beschreibung"`
- **Linting:** `ruff check .` und `black --check .`
- **Pre-Commit:** Konfiguriert über `.pre-commit-config.yaml`
- **Version erhöhen:** `pdm run bump`

## NPM-Scripts / Build-Befehle

### Client (Frontend)

| Script | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktionsbuild erstellen |
| `npm run preview` | Build lokal testen |
| `npm run check-i18n` | Internationalisierung prüfen |

### Public Print Request

| Script | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktionsbuild erstellen |
| `npm run lint` | ESLint ausführen |
| `npm run preview` | Build lokal testen |

### PDM-Scripts (Backend)

| Script | Zweck |
|--------|-------|
| `pdm run app` | Backend starten |
| `pdm run docs` | API-Docs generieren |
| `pdm run bump` | Version erhöhen |
| `pdm run itest` | Integrationstests |

## Änderungsverlauf der Dokumentation

| Datum | Änderung |
|-------|----------|
| 2026-06-21 | NIIMBOT-Label-Download-Funktion dokumentiert |
| 2026-06-15 | Dokumentation aktualisiert |
| 2025-07-18 | README vollständig nach Dokumentationsrichtlinie erstellt |
