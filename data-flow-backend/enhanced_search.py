# enhanced_search.py
# Erweiterter NLP-Ansatz für die Datenfluss-Suche

import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Set
import logging
import re
from rapidfuzz import fuzz, process
import json

# Konfiguriere Logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedSearch:
    """
    Fortschrittliche Suchklasse für Datenfluss-Informationen mit semantischem Matching,
    unscharfer Suche und kontextbasierter Ergebnisgewichtung.
    """
    
    def __init__(self, data_store):
        """
        Initialisiert die Suchklasse mit dem Datenstore und generiert Suchindizes.
        
        :param data_store: Dictionary mit den Datenflüssen und zugehörigen Informationen
        """
        self.data_store = data_store
        logger.info("Initialisiere erweiterte Suchfunktion...")
        
        # Extrahiere wichtige Terme aus den Daten
        self.extract_key_terms()
        
        # Erstelle invertierte Indizes für schnelle Suche
        self.create_search_indices()
        
        # Vorbereitung von Synonymen und Varianten
        self.prepare_synonym_mapping()
        
        logger.info("Erweiterte Suchfunktion initialisiert")
    
    def extract_key_terms(self):
        """Extrahiere wichtige Begriffe und Kategorien aus den Daten"""
        self.systems = list(self.data_store["systems"])
        self.formats = list(self.data_store["formats"])
        self.transmission_methods = list(self.data_store["transmission_methods"])
        self.interfaces = list(self.data_store["interfaces"])
        
        logger.info(f"Extrahierte Schlüsselbegriffe: {len(self.systems)} Systeme, "
                   f"{len(self.formats)} Formate, {len(self.transmission_methods)} Übertragungsmethoden, "
                   f"{len(self.interfaces)} Schnittstellen")
    
    def create_search_indices(self):
        """Erstelle invertierte Indizes für schnelle Suche"""
        self.flow_index = {}  # ID -> Flow
        self.name_index = {}  # Tokens -> [Flow IDs]
        self.description_index = {}  # Tokens -> [Flow IDs]
        self.system_index = {}  # System -> [Flow IDs]
        self.format_index = {}  # Format -> [Flow IDs]
        self.transmission_index = {}  # Method -> [Flow IDs]
        self.interface_index = {}  # Interface -> [Flow IDs]
        
        # Indiziere alle Datenflüsse
        for flow in self.data_store["data_flows"]:
            flow_id = flow["id"]
            self.flow_index[flow_id] = flow
            
            # Name indizieren
            if "name" in flow and flow["name"]:
                name_tokens = self._tokenize(flow["name"])
                for token in name_tokens:
                    if token not in self.name_index:
                        self.name_index[token] = []
                    self.name_index[token].append(flow_id)
            
            # Beschreibung indizieren
            if "description" in flow and flow["description"]:
                desc_tokens = self._tokenize(flow["description"])
                for token in desc_tokens:
                    if token not in self.description_index:
                        self.description_index[token] = []
                    self.description_index[token].append(flow_id)
            
            # Systeme indizieren
            if "source_system" in flow and flow["source_system"]:
                if flow["source_system"] not in self.system_index:
                    self.system_index[flow["source_system"]] = []
                self.system_index[flow["source_system"]].append(flow_id)
            
            if "target_system" in flow and flow["target_system"]:
                if flow["target_system"] not in self.system_index:
                    self.system_index[flow["target_system"]] = []
                self.system_index[flow["target_system"]].append(flow_id)
            
            # Format indizieren
            if "format" in flow and flow["format"]:
                if flow["format"] not in self.format_index:
                    self.format_index[flow["format"]] = []
                self.format_index[flow["format"]].append(flow_id)
            
            # Übertragungsmethode indizieren
            if "transmission_method" in flow and flow["transmission_method"]:
                methods = flow["transmission_method"].split(";")
                for method in methods:
                    method = method.strip()
                    if method:
                        if method not in self.transmission_index:
                            self.transmission_index[method] = []
                        self.transmission_index[method].append(flow_id)
            
            # Schnittstellen indizieren
            if "process_steps" in flow and flow["process_steps"]:
                for step in flow["process_steps"]:
                    if "interface" in step and step["interface"]:
                        interface = step["interface"]
                        if interface not in self.interface_index:
                            self.interface_index[interface] = []
                        self.interface_index[interface].append(flow_id)
        
        logger.info(f"Suchindizes erstellt: {len(self.flow_index)} Flows indiziert")
    
    def prepare_synonym_mapping(self):
        """Erstellt Synonymzuordnungen für verschiedene Schlüsselbegriffe"""
        # Systeme-Synonyme
        self.system_variants = {}
        for system in self.systems:
            variants = []
            if "MIRA" in system:
                variants.extend(["mira", "mirasystem"])
            if "GAS-X" in system:
                variants.extend(["gasx", "gas-x", "gas x"])
            if "GRID" in system:
                variants.extend(["grid", "netzseite"])
            if "BKN" in system:
                variants.extend(["bkn", "bilanzkreis", "bilanzierung"])
            if "Marktpartner" in system:
                variants.extend(["marktpartner", "shipper", "transportkunde", "lieferant"])
            if "VHP" in system:
                variants.extend(["vhp", "portal", "web", "webportal"])
                
            # Varianten zum System hinzufügen
            self.system_variants[system] = variants
        
        # Format-Synonyme
        self.format_variants = {}
        for format_name in self.formats:
            variants = []
            if format_name == "NOMINT":
                variants.extend(["nominierung", "nomination", "nomint"])
            elif format_name == "NOMRES":
                variants.extend(["nominierungsantwort", "confirmation", "bestätigung", "bestaetigung"])
            elif format_name == "CONTRL":
                variants.extend(["kontrolle", "kontrollmeldung", "control"])
            elif format_name == "APERAK":
                variants.extend(["fehler", "fehlermeldung", "error"])
            elif format_name == "ACKNOW":
                variants.extend(["quittung", "bestätigung", "bestaetigung", "acknowledgement"])
            elif format_name == "ALOCAT":
                variants.extend(["allokation", "allocation", "zuteilung"])
                
            # Varianten zum Format hinzufügen
            self.format_variants[format_name] = variants
        
        # Übertragungsmethoden-Synonyme
        self.transmission_variants = {}
        for method in self.transmission_methods:
            variants = []
            if method == "AS4":
                variants.extend(["as4", "as 4", "bsi"])
            elif method == "AS2":
                variants.extend(["as2", "as 2"])
            elif method == "SMTP":
                variants.extend(["smtp", "email", "e-mail", "mail"])
            elif method == "Webservice":
                variants.extend(["webservice", "web service", "web", "rest", "api"])
                
            # Varianten zur Übertragungsmethode hinzufügen
            self.transmission_variants[method] = variants
            
        logger.info("Synonyme und Varianten für Schlüsselbegriffe vorbereitet")
    
    def search(self, query: str, max_results: int = 20) -> Dict[str, Any]:
        """
        Führt eine erweiterte Suche anhand der Benutzeranfrage durch
        
        :param query: Die natürlichsprachliche Suchanfrage
        :param max_results: Maximale Anzahl der direkten Treffer
        :return: Dictionary mit direkten und verwandten Treffern
        """
        logger.info(f"Suche gestartet für: '{query}'")
        
        # Normalisiere und tokenisiere die Anfrage
        query = query.lower()
        query_tokens = self._tokenize(query)
        
        # Scores für jeden Datenfluss initialisieren
        flow_scores = {flow_id: 0.0 for flow_id in self.flow_index}
        
        # 1. Analyse der Anfrage auf Entitäten und Muster
        query_entities = self._extract_entities(query)
        logger.info(f"Extrahierte Entitäten: {query_entities}")
        
        # 2. Basissuche mit extrahierten Entitäten
        self._search_with_entities(query_entities, flow_scores)
        
        # 3. Fuzzy-Terminologie-Matching für nicht erkannte Begriffe
        if not query_entities["unknown_terms"]:
            query_entities["unknown_terms"] = query_tokens
        self._fuzzy_term_matching(query_entities["unknown_terms"], flow_scores)
        
        # 4. Volltext-Matching in Namen und Beschreibungen
        self._fulltext_search(query_tokens, flow_scores)
        
        # 5. Musterbasierte Suche (Richtungsangaben etc.)
        self._pattern_based_search(query, flow_scores)
        
        # Ergebnisse sortieren nach Score
        sorted_results = sorted(
            [(flow_id, score) for flow_id, score in flow_scores.items() if score > 0],
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Direkte Treffer auswählen
        direct_results = []
        matching_systems = set()
        for flow_id, score in sorted_results[:max_results]:
            flow = self.flow_index[flow_id]
            flow["search_score"] = round(score, 2)  # Score anhängen
            direct_results.append(flow)
            
            # Systeme aus direkten Treffern sammeln
            if "source_system" in flow and flow["source_system"]:
                matching_systems.add(flow["source_system"])
            if "target_system" in flow and flow["target_system"]:
                matching_systems.add(flow["target_system"])
        
        # Verwandte Datenflüsse finden (basierend auf den Systemen aus direkten Treffern)
        related_flows = []
        for flow_id, flow in self.flow_index.items():
            if flow in direct_results:
                continue
                
            if ((flow.get("source_system") and flow["source_system"] in matching_systems) or
                (flow.get("target_system") and flow["target_system"] in matching_systems)):
                related_flows.append(flow)
        
        # Natürlichsprachliche Antwort generieren
        natural_response = self._generate_response(query, direct_results, related_flows, query_entities)
        
        # Ergebnisse zurückgeben
        results = {
            "direct_results": direct_results,
            "related_flows": related_flows[:10],  # Begrenze verwandte Flüsse
            "matching_systems": list(matching_systems),
            "query_entities": query_entities,  # Debugging-Informationen
            "natural_response": natural_response
        }
        
        logger.info(f"Suche abgeschlossen: {len(direct_results)} direkte Treffer, "
                   f"{len(related_flows)} verwandte Flüsse")
        
        return results
    
    def _tokenize(self, text: str) -> List[str]:
        """Tokenisiert einen Text in Wörter"""
        if not text:
            return []
        
        # Normalisiere Text (Kleinbuchstaben, Sonderzeichen entfernen)
        text = text.lower()
        # Ersetze Bindestriche durch Leerzeichen
        text = text.replace("-", " ")
        # Entferne alle Sonderzeichen außer Leerzeichen
        text = re.sub(r'[^\w\s]', '', text)
        # Tokenisiere
        tokens = text.split()
        # Entferne zu kurze Wörter und allgemeine Stoppwörter
        stopwords = ['der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'für', 'fuer', 'mit', 'bei', 'von', 'zu']
        tokens = [t for t in tokens if len(t) > 2 and t not in stopwords]
        
        return tokens
    
    def _extract_entities(self, query: str) -> Dict[str, Any]:
        """
        Extrahiert Entitäten aus der Suchanfrage (Systeme, Formate, Übertragungsmethoden usw.)
        
        :param query: Die Suchanfrage
        :return: Dictionary mit erkannten Entitäten
        """
        entities = {
            "systems": [],
            "formats": [],
            "transmission_methods": [],
            "interfaces": [],
            "unknown_terms": [],
            "direction": None  # 'from', 'to', oder 'between'
        }
        
        # Tokenisiere die Anfrage
        query_tokens = set(self._tokenize(query))
        matched_tokens = set()
        
        # System-Matching
        for system in self.systems:
            system_tokens = set(self._tokenize(system))
            # Prüfe, ob System-Tokens in der Anfrage vorkommen
            if system_tokens and system_tokens.intersection(query_tokens):
                entities["systems"].append(system)
                matched_tokens.update(system_tokens)
            else:
                # Prüfe Varianten
                for variant in self.system_variants.get(system, []):
                    if variant in query.lower():
                        entities["systems"].append(system)
                        matched_tokens.update(variant.split())
                        break
        
        # Format-Matching
        for format_name in self.formats:
            if format_name.lower() in query.lower():
                entities["formats"].append(format_name)
                matched_tokens.update(format_name.lower().split())
            else:
                # Prüfe Varianten
                for variant in self.format_variants.get(format_name, []):
                    if variant in query.lower():
                        entities["formats"].append(format_name)
                        matched_tokens.update(variant.split())
                        break
        
        # Übertragungsmethoden-Matching
        for method in self.transmission_methods:
            if method.lower() in query.lower():
                entities["transmission_methods"].append(method)
                matched_tokens.update(method.lower().split())
            else:
                # Prüfe Varianten
                for variant in self.transmission_variants.get(method, []):
                    if variant in query.lower():
                        entities["transmission_methods"].append(method)
                        matched_tokens.update(variant.split())
                        break
        
        # Schnittstellen-Matching (exakt, da technische Bezeichner)
        for interface in self.interfaces:
            if interface.lower() in query.lower():
                entities["interfaces"].append(interface)
                matched_tokens.update(interface.lower().split())
        
        # Richtung erkennen
        if "von" in query.lower() or "from" in query.lower():
            entities["direction"] = "from"
        elif "zu" in query.lower() or "nach" in query.lower() or "to" in query.lower():
            entities["direction"] = "to"
        elif "zwischen" in query.lower() or "between" in query.lower():
            entities["direction"] = "between"
        
        # Nicht zugeordnete Tokens sammeln
        entities["unknown_terms"] = list(query_tokens - matched_tokens)
        
        return entities
    
    def _search_with_entities(self, entities: Dict[str, Any], flow_scores: Dict[str, float]):
        """
        Führt eine Suche mit den erkannten Entitäten durch und aktualisiert die Flow-Scores
        
        :param entities: Dictionary mit erkannten Entitäten
        :param flow_scores: Dictionary zur Aufnahme der Flow-Scores
        """
        # Nach Systemen suchen
        for system in entities["systems"]:
            if system in self.system_index:
                for flow_id in self.system_index[system]:
                    flow = self.flow_index[flow_id]
                    # Höherer Score, wenn das System sowohl Quelle als auch Ziel ist
                    if flow.get("source_system") == system and flow.get("target_system") == system:
                        flow_scores[flow_id] += 3.0
                    # Unterschiedliche Scores je nach Rolle und Richtung
                    elif entities["direction"] == "from" and flow.get("source_system") == system:
                        flow_scores[flow_id] += 2.0
                    elif entities["direction"] == "to" and flow.get("target_system") == system:
                        flow_scores[flow_id] += 2.0
                    elif entities["direction"] == "between":
                        flow_scores[flow_id] += 1.0
                    else:
                        flow_scores[flow_id] += 1.0
        
        # Nach Formaten suchen
        for format_name in entities["formats"]:
            if format_name in self.format_index:
                for flow_id in self.format_index[format_name]:
                    flow_scores[flow_id] += 2.0
        
        # Nach Übertragungsmethoden suchen
        for method in entities["transmission_methods"]:
            if method in self.transmission_index:
                for flow_id in self.transmission_index[method]:
                    flow_scores[flow_id] += 1.5
        
        # Nach Schnittstellen suchen
        for interface in entities["interfaces"]:
            if interface in self.interface_index:
                for flow_id in self.interface_index[interface]:
                    flow_scores[flow_id] += 2.5
    
    def _fuzzy_term_matching(self, unknown_terms: List[str], flow_scores: Dict[str, float]):
        """
        Führt unscharfes Matching für nicht erkannte Begriffe durch
        
        :param unknown_terms: Liste nicht erkannter Begriffe
        :param flow_scores: Dictionary zur Aufnahme der Flow-Scores
        """
        if not unknown_terms:
            return
        
        # Sammle alle möglichen Begriffe zum Abgleich
        all_terms = []
        term_to_flow_map = {}
        
        # Sammle Begriffe aus Flow-Namen
        for flow_id, flow in self.flow_index.items():
            if flow.get("name"):
                for token in self._tokenize(flow["name"]):
                    if token not in all_terms:
                        all_terms.append(token)
                        term_to_flow_map[token] = []
                    term_to_flow_map[token].append(flow_id)
        
        # Fuzzy-Matching für jeden unbekannten Begriff
        for term in unknown_terms:
            if len(term) < 3:
                continue
                
            # Fuzzy-Matching mit rapidfuzz
            matches = process.extract(term, all_terms, scorer=fuzz.ratio, limit=5)
            
            for match, score, _ in matches:
                if score >= 80:  # Schwellenwert für gültige Matches
                    # Gewichtung basierend auf Match-Score
                    weight = score / 100.0
                    for flow_id in term_to_flow_map.get(match, []):
                        flow_scores[flow_id] += weight
    
    def _fulltext_search(self, query_tokens: List[str], flow_scores: Dict[str, float]):
        """
        Führt eine Volltextsuche in Namen und Beschreibungen durch
        
        :param query_tokens: Tokenisierte Suchanfrage
        :param flow_scores: Dictionary zur Aufnahme der Flow-Scores
        """
        # Suche in Namen
        for token in query_tokens:
            if token in self.name_index:
                for flow_id in self.name_index[token]:
                    flow_scores[flow_id] += 1.0
        
        # Suche in Beschreibungen
        for token in query_tokens:
            if token in self.description_index:
                for flow_id in self.description_index[token]:
                    flow_scores[flow_id] += 0.7
    
    def _pattern_based_search(self, query: str, flow_scores: Dict[str, float]):
        """
        Führt eine musterbasierte Suche für spezifische Abfragetypen durch
        
        :param query: Die ursprüngliche Suchanfrage
        :param flow_scores: Dictionary zur Aufnahme der Flow-Scores
        """
        # Muster für "von X nach Y" oder ähnliche Richtungsabfragen
        direction_patterns = [
            (r'von\s+(\w+)[\s\w]*nach\s+(\w+)', 'from_to'),
            (r'from\s+(\w+)[\s\w]*to\s+(\w+)', 'from_to'),
            (r'zwischen\s+(\w+)[\s\w]+und\s+(\w+)', 'between'),
            (r'between\s+(\w+)[\s\w]+and\s+(\w+)', 'between')
        ]
        
        for pattern, pattern_type in direction_patterns:
            matches = re.search(pattern, query.lower())
            if matches:
                if pattern_type == 'from_to':
                    source_term, target_term = matches.groups()
                    source_system = self._find_best_system_match(source_term)
                    target_system = self._find_best_system_match(target_term)
                    
                    if source_system and target_system:
                        for flow_id, flow in self.flow_index.items():
                            if (flow.get("source_system") == source_system and 
                                flow.get("target_system") == target_system):
                                flow_scores[flow_id] += 5.0  # Hoher Score für exakte Übereinstimmung
                
                elif pattern_type == 'between':
                    system1_term, system2_term = matches.groups()
                    system1 = self._find_best_system_match(system1_term)
                    system2 = self._find_best_system_match(system2_term)
                    
                    if system1 and system2:
                        for flow_id, flow in self.flow_index.items():
                            if ((flow.get("source_system") == system1 and flow.get("target_system") == system2) or
                                (flow.get("source_system") == system2 and flow.get("target_system") == system1)):
                                flow_scores[flow_id] += 5.0  # Hoher Score für exakte Übereinstimmung
    
    def _find_best_system_match(self, term: str) -> Optional[str]:
        """
        Findet das am besten passende System für einen Begriff
        
        :param term: Der zu matchende Begriff
        :return: Das am besten passende System oder None
        """
        if not term:
            return None
            
        # Exakter Match
        for system in self.systems:
            if term.lower() in system.lower() or system.lower() in term.lower():
                return system
                
        # Fuzzy-Matching
        matches = process.extract(term, self.systems, scorer=fuzz.ratio, limit=1)
        if matches and matches[0][1] >= 75:  # Schwellenwert für gültiges Match
            return matches[0][0]
            
        return None
    
    def _generate_response(self, query: str, direct_results: List[Dict], 
                          related_flows: List[Dict], entities: Dict[str, Any]) -> str:
        """
        Generiert eine natürlichsprachliche Antwort basierend auf den Suchergebnissen
        
        :param query: Die ursprüngliche Suchanfrage
        :param direct_results: Liste direkter Ergebnisse
        :param related_flows: Liste verwandter Datenflüsse
        :param entities: Erkannte Entitäten
        :return: Natürlichsprachliche Antwort
        """
        if not direct_results and not related_flows:
            return f"Ich konnte keine Datenflüsse finden, die zu Ihrer Anfrage '{query}' passen."
        
        # Basis der Antwort
        response_parts = []
        
        # Erkannte Entitäten in die Antwort einbauen
        entity_mention = []
        if entities["systems"]:
            if len(entities["systems"]) == 1:
                entity_mention.append(f"das System {entities['systems'][0]}")
            else:
                entity_mention.append(f"die Systeme {', '.join(entities['systems'])}")
        
        if entities["formats"]:
            if len(entities["formats"]) == 1:
                entity_mention.append(f"das Format {entities['formats'][0]}")
            else:
                entity_mention.append(f"die Formate {', '.join(entities['formats'])}")
        
        if entities["transmission_methods"]:
            if len(entities["transmission_methods"]) == 1:
                entity_mention.append(f"die Übertragungsmethode {entities['transmission_methods'][0]}")
            else:
                entity_mention.append(f"die Übertragungsmethoden {', '.join(entities['transmission_methods'])}")
        
        if entities["interfaces"]:
            if len(entities["interfaces"]) == 1:
                entity_mention.append(f"die Schnittstelle {entities['interfaces'][0]}")
            else:
                entity_mention.append(f"die Schnittstellen {', '.join(entities['interfaces'])}")
        
        # Zusammenstellung der Antwort
        if entity_mention:
            response_parts.append(f"Für Ihre Anfrage zu {' und '.join(entity_mention)} habe ich ")
        else:
            response_parts.append(f"Für Ihre Anfrage '{query}' habe ich ")
        
        # Anzahl der direkten Treffer
        if direct_results:
            if len(direct_results) == 1:
                flow = direct_results[0]
                flow_name = flow.get("name", flow.get("id", "Unbekannt"))
                response_parts.append(f"einen passenden Datenfluss gefunden: '{flow_name}'")
                
                # Details zum gefundenen Datenfluss
                flow_details = []
                if flow.get("source_system") and flow.get("target_system"):
                    flow_details.append(f"von {flow['source_system']} nach {flow['target_system']}")
                if flow.get("format"):
                    flow_details.append(f"im Format {flow['format']}")
                if flow.get("transmission_method"):
                    flow_details.append(f"über {flow['transmission_method']}")
                
                if flow_details:
                    response_parts.append(f" ({', '.join(flow_details)})")
            else:
                response_parts.append(f"{len(direct_results)} passende Datenflüsse gefunden")
                
                # Die wichtigsten Systeme hervorheben
                systems_in_results = set()
                for flow in direct_results:
                    if flow.get("source_system"):
                        systems_in_results.add(flow["source_system"])
                    if flow.get("target_system"):
                        systems_in_results.add(flow["target_system"])
                
                if systems_in_results and len(systems_in_results) <= 5:
                    response_parts.append(f", beteiligt sind die Systeme {', '.join(systems_in_results)}")
        else:
            response_parts.append("keine direkt passenden Datenflüsse gefunden")
        
        # Verwandte Datenflüsse erwähnen
        if related_flows:
            response_parts.append(f". Zusätzlich gibt es {len(related_flows)} verwandte Datenflüsse, die mit ähnlichen Systemen verbunden sind")
        else:
            response_parts.append(".")
        
        return "".join(response_parts)
