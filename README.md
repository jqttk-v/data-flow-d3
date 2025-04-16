# Datenfluss-Dashboard Technische & Funktionale Dokumentation

## Projektübersicht

Das Datenfluss-Dashboard ist eine fortschrittliche Visualisierungs- und Managementplattform, die umfassende Einblicke in Datenflüsse zwischen Systemen bietet, mit Fokus auf Datenaustauschmustern und -prozessen in der Gasindustrie. Die Plattform ermöglicht es Stakeholdern im gesamten Unternehmen, die komplexen Beziehungen zwischen Systemen, Schnittstellen und Datenformaten zu verstehen, zu analysieren und zu überwachen.

![Datenfluss-Dashboard](https://via.placeholder.com/800x400?text=Datenfluss-Dashboard+Screenshot)

### Hauptmerkmale

- **Interaktive Netzwerkvisualisierung**: Dynamische, kraftgerichtete Graphenvisualisierung von Systemen, Schnittstellen und Datenflüssen
- **Mehrere Ansichtsmodi**: Spezialisierte Visualisierungsmodi für verschiedene Nutzergruppen (Geschäftsübersicht, fokussierter Geschäftskontext, technische Details)
- **Natürlichsprachliche Suche**: Intelligente Suchfunktionen mit semantischem Verständnis der Branchenterminologie
- **Detaillierte Flussanalyse**: Prozessschrittvisualisierung, Systembeziehungsmapping und technische Diagnose
- **Adaptive Benutzeroberfläche**: Kontextsensitive Panels, die relevante Informationen basierend auf Benutzerauswahl und aktuellem Modus bereitstellen

## Technologie-Stack

### Backend

- **Python 3.9+**: Kern-Backend-Sprache
- **FastAPI**: Hochleistungs-Webframework für API-Endpunkte
- **XML-Verarbeitung**: Datenanalyse aus strukturierten XML-Eingaben
- **NLP-Komponenten**: Erweiterte Suche mit Fuzzy-Matching und semantischem Verständnis
- **Uvicorn**: ASGI-Server-Implementierung

### Frontend

- **React.js**: Komponentenbasierte UI-Bibliothek für die Frontend-Anwendung
- **D3.js**: Fortschrittliche Datenvisualisierungsbibliothek für interaktive Netzwerkgraphen
- **JavaScript ES6+**: Moderne JavaScript-Funktionen für Frontend-Logik
- **CSS3**: Styling mit responsiven Designprinzipien
- **HTML5**: Semantische Markup-Struktur

## Systemarchitektur

Die Anwendung folgt einer Client-Server-Architektur mit einer RESTful-API-Schnittstelle:

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│                 │       │                     │       │                 │
│  XML-Datenspeicher │────▶  FastAPI-Backend    │◀──────▶  React-Frontend │
│                 │       │                     │       │                 │
└─────────────────┘       └─────────────────────┘       └─────────────────┘
                                    │                           │
                                    │                           │
                                    ▼                           ▼
                          ┌─────────────────────┐     ┌─────────────────────┐
                          │  Erweiterte Suche   │     │  D3.js              │
                          │  NLP-Komponenten    │     │  Visualisierung     │
                          └─────────────────────┘     └─────────────────────┘
```

### Datenfluss

1. System lädt Daten aus XML-Quellen in das FastAPI-Backend
2. React-Frontend fordert Daten über RESTful-API-Endpunkte an
3. Benutzerinteraktionen lösen API-Aufrufe für Datenfilterung, Suche und Abruf aus
4. Visualisierungskomponenten rendern Daten mit D3.js-kraftgerichteten Graphen
5. Benutzerauswahlen steuern kontextbezogene Änderungen in den UI-Komponenten

## Backend-Komponenten

### API-Endpunkte

Das Backend stellt mehrere RESTful-API-Endpunkte bereit:

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/data-flows` | GET | Datenflüsse mit optionaler Filterung abrufen |
| `/api/data-flows/{flow_id}` | GET | Details für einen bestimmten Datenfluss abrufen |
| `/api/systems` | GET | Alle verfügbaren Systeme abrufen |
| `/api/formats` | GET | Alle verfügbaren Datenformate abrufen |
| `/api/transmission-methods` | GET | Alle verfügbaren Übertragungsmethoden abrufen |
| `/api/interfaces` | GET | Alle verfügbaren Schnittstellen abrufen |
| `/api/query` | POST | Natürlichsprachliche Suchanfragen ausführen |
| `/api/reload` | POST | Daten aus XML-Quelle neu laden |

### Erweiterte Suchfunktionen

Das System umfasst eine ausgeklügelte Suchmaschine mit folgenden Funktionen:

- **Semantisches Verständnis**: Erkennung von Systemnamen, Formaten und technischer Terminologie
- **Fuzzy-Matching**: Toleranz gegenüber Rechtschreibfehlern und Terminologievarianten
- **Kontextbewusste Ergebnisse**: Identifikation von direkt relevanten und verwandten Datenflüssen
- **Verarbeitung von Geschäftssprache**: Unterstützung für Geschäftsprozessterminologie

Beispiel für die Suchverarbeitung:

```python
# 1. Anfrage analysieren, um Entitäten zu extrahieren
query_entities = extract_entities(query)

# 2. Basissuche mit Entitäten durchführen
flow_scores = search_with_entities(query_entities)

# 3. Fuzzy-Matching für nicht erkannte Begriffe anwenden
flow_scores = fuzzy_term_matching(query_entities, flow_scores)

# 4. Musterbasierte Suche ausführen (gerichtete Anfragen)
flow_scores = pattern_based_search(query, flow_scores)

# 5. Sortierte Ergebnisse zurückgeben
return sorted_results(flow_scores)
```

## Frontend-Komponenten

### Komponentenstruktur

Die Anwendung besteht aus mehreren wichtigen React-Komponenten:

```
EnhancedDashboard
├── ModeSelector
├── SearchBar
├── FilterBar
├── EnhancedNetworkGraph
│   ├── D3-Visualisierung
│   └── Interaktive Steuerelemente
├── DynamicFlowSequence
│   └── Animierte Flussvisualisierung
└── AdaptiveDetailPanel
    ├── Systemdetails
    ├── Flussdetails
    └── Prozessvisualisierung
```

### Visualisierungsmodi

Die Anwendung unterstützt drei verschiedene Visualisierungsmodi:

1. **Übersichtsmodus**: Vollständige Visualisierung aller Systeme und Datenflüsse
   - Hierarchische Struktur mit Systemen, Schnittstellen und Datenflüssen
   - Fokus auf Systembeziehungen und Gesamtarchitektur

2. **Fokussierter Modus**: Geschäftsorientierte Ansicht spezifischer Systeme und Prozesse
   - Kontextbezogene Informationen über Geschäftsprozesse
   - Betonung von Systembeziehungen und Datenflusszielen
   - Detaillierte Prozessschrittvisualisierung mit Geschäftskontext

3. **Technischer Modus**: Detaillierte technische Informationen und Diagnostik
   - Anzeige erweiterter technischer Metadaten
   - Diagnoseinformationen und Statusindikatoren
   - Schnittstellenspezifikationen und Protokolldetails

### Netzwerkgraph-Visualisierung

Die Kernvisualisierung verwendet D3.js-kraftgerichtete Graphen mit folgenden Funktionen:

- **Kraftsimulation**: Dynamische, physikbasierte Knotenpositionierung
- **Interaktive Elemente**: Ziehbare Knoten mit Zoom- und Schwenksteuerung
- **Visuelle Kodierung**: Farbcodierung basierend auf Systemtypen und Datenformaten
- **Hervorhebung**: Pfadverfolgung für ausgewählte Flüsse und verbundene Knoten
- **Tooltips**: Kontextsensitive Informationen beim Überfahren mit der Maus
- **Animation**: Flusspartikel zur Anzeige der Datenbewegungsrichtung

Implementierungshighlights:

```javascript
// Kraftsimulation basierend auf aktuellem Modus erstellen
simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id).distance(calculateDistance))
  .force('charge', d3.forceManyBody().strength(calculateStrength))
  .force('collision', d3.forceCollide().radius(calculateRadius))
  // Benutzerdefinierte Kräfte je nach Visualisierungsmodus anwenden
  .force('levelSpread', applyLevelSpreadingForce)
  .force('type-clustering', applyTypeClusteringForce);
```

## Schlüsselfunktionen im Detail

### Dynamische Flussvisualisierung

Die Anwendung bietet eine dynamische, animierte Visualisierung von Datenflüssen:

- **Prozessschrittsequenzierung**: Visuelle Darstellung von Verarbeitungsschritten
- **Animierte Datenpartikel**: Bewegliche Partikel zeigen die Datenflussrichtung an
- **Interaktive Wiedergabe**: Animationssteuerung für schrittweise Prozesserkundung
- **Statusindikatoren**: Visuelles Feedback zum Flussstatus und zur -gesundheit

### Adaptives Detailpanel

Das Detailpanel passt seinen Inhalt basierend auf dem aktuellen Modus und der Auswahl an:

- **Übersichtsmodus**: Geschäftsorientierte Informationen mit grundlegenden Flussdetails
- **Fokussierter Modus**: Prozessorientierte Ansicht mit Geschäftskontext und Stakeholdern
- **Technischer Modus**: Detaillierte technische Spezifikationen, Diagnosen und Metriken

### Intelligente Suche

Die Suchfunktionalität kombiniert mehrere Techniken:

- **Entitätserkennung**: Identifikation von Systemen, Formaten und technischen Begriffen
- **Fuzzy-Matching**: Toleranz gegenüber Rechtschreibvariationen und Synonymen
- **Richtungserkennung**: Verständnis von "von/zu"-Abfragemustern
- **Natürlichsprachliche Antwort**: Generierte Zusammenfassungen von Suchergebnissen

## Technische Implementierungsdetails

### D3.js-Integration

Die D3.js-Visualisierung ist tief in React integriert:

- **React-D3-Muster**: Verwendet React für die Komponentenstruktur und D3 für DOM-Manipulation
- **UseEffect-Synchronisierung**: Kontrollierte D3-Updates durch React-Lifecycle-Methoden
- **Interaktivität**: Bidirektionale Kommunikation zwischen D3-Events und React-State

### Leistungsoptimierungen

Mehrere Leistungsoptimierungen wurden implementiert:

- **Effizientes Rendering**: Selektive Updates von D3-Elementen durch angemessene Schlüsselzuweisung
- **Gedrosselte Interaktionen**: Entprellte Such- und Filteroperationen
- **Inkrementelles Layout**: Progressive Kraftsimulation mit Abkühlungsplänen
- **Optimierte Pfadberechnung**: Effiziente Pfadverfolgung für Flusshervorhebung

### Responsives Design

Die Benutzeroberfläche passt sich an verschiedene Bildschirmgrößen an mit:

- **Flexible Layouts**: Grid- und Flexbox-basierte Komponentenanordnungen
- **Adaptiver Detailgrad**: Vereinfachte Visualisierung auf kleineren Bildschirmen
- **Touch-freundliche Steuerelemente**: Unterstützung für Touch-Interaktionen auf mobilen Geräten

## Bereitstellung und Integration

### Systemanforderungen

- **Backend**:
  - Python 3.9 oder höher
  - Mindestens 4 GB RAM (8 GB empfohlen)
  - Mindestens 2 CPU-Kerne (4 empfohlen)

- **Frontend**:
  - Moderner Browser mit ES6-Unterstützung
  - 2 GB verfügbarer Speicher
  - Bildschirmauflösung von 1280x800 oder höher

### Integrationspunkte

Das System kann mit externen Systemen integriert werden über:

- **REST-API**: Direkter API-Zugriff für benutzerdefinierte Integrationen
- **XML-Datenimport**: Strukturierter Datenimport aus externen Systemen oder Datenbanken
- **Authentifizierungsschicht**: Unterstützung für Standard-Authentifizierungsmethoden



