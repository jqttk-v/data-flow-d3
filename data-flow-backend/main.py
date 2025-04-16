# main.py
import xml.etree.ElementTree as ET
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import uvicorn
import logging
import json
import time

# Importiere die erweiterte Suchklasse
from enhanced_search import EnhancedSearch

# Konfiguriere Logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Data Flow Dashboard API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# In-memory store for the parsed data
data_store = {
    "data_flows": [],
    "systems": set(),
    "formats": set(),
    "transmission_methods": set(),
    "interfaces": set(),
}

# Global variable for enhanced search instance
enhanced_searcher = None

# Datenmodelle für Request und Response
class DataFlow(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    transmission_method: Optional[str] = ""
    format: Optional[str] = ""
    trigger: Optional[str] = ""
    source_system: str
    target_system: str
    process_steps: List[Dict[str, str]] = []

class QueryRequest(BaseModel):
    query: str

# Neues Query-Modell für Kompatibilität mit erster Implementierung
class LegacyQueryRequest(BaseModel):
    text: Optional[str] = None

# Parse the XML file and populate the data store
def parse_xml_file(file_path: str):
    try:
        logger.info(f"Parsing XML file: {file_path}")
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Leere die bestehenden Daten
        data_store["data_flows"] = []
        data_store["systems"] = set()
        data_store["formats"] = set()
        data_store["transmission_methods"] = set()
        data_store["interfaces"] = set()
        
        for datenfluss in root.findall(".//Datenfluss"):
            # Extract basic info
            flow_id = datenfluss.find("Custom_ID").text if datenfluss.find("Custom_ID") is not None else ""
            name = datenfluss.find("Name_des_Datenflusses").text if datenfluss.find("Name_des_Datenflusses") is not None else ""
            description = datenfluss.find("Beschreibung").text if datenfluss.find("Beschreibung") is not None else ""
            transmission = datenfluss.find("Uebertragungsweg").text if datenfluss.find("Uebertragungsweg") is not None else ""
            format_str = datenfluss.find("Format").text if datenfluss.find("Format") is not None else ""
            trigger = datenfluss.find("Ausloser").text if datenfluss.find("Ausloser") is not None else ""
            
            # Extract source and target systems
            source_system = ""
            if datenfluss.find("QuelleSystem") is not None and datenfluss.find("QuelleSystem").find("n") is not None:
                source_system = datenfluss.find("QuelleSystem").find("n").text
            
            target_system = ""
            if datenfluss.find("Zielsystem") is not None and datenfluss.find("Zielsystem").find("n") is not None:
                target_system = datenfluss.find("Zielsystem").find("n").text
            
            # Extract process steps
            process_steps = []
            if datenfluss.find("Prozessschritte") is not None:
                for step in datenfluss.find("Prozessschritte").findall("Prozessschritt"):
                    step_type = step.find("Schritttyp").text if step.find("Schritttyp") is not None else ""
                    interface = step.find("Schnittstelle").text if step.find("Schnittstelle") is not None else ""
                    process_steps.append({
                        "step_type": step_type,
                        "interface": interface
                    })
                    if interface:
                        data_store["interfaces"].add(interface)
            
            # Create data flow object
            data_flow = {
                "id": flow_id,
                "name": name,
                "description": description,
                "transmission_method": transmission,
                "format": format_str,
                "trigger": trigger,
                "source_system": source_system,
                "target_system": target_system,
                "process_steps": process_steps
            }
            
            # Add to data store
            data_store["data_flows"].append(data_flow)
            if source_system:
                data_store["systems"].add(source_system)
            if target_system:
                data_store["systems"].add(target_system)
            if format_str:
                data_store["formats"].add(format_str)
            
            # Handle multiple transmission methods
            if transmission and ";" in transmission:
                for method in transmission.split(";"):
                    if method.strip():
                        data_store["transmission_methods"].add(method.strip())
            elif transmission:
                data_store["transmission_methods"].add(transmission)
        
        logger.info(f"Parsed {len(data_store['data_flows'])} data flows")
        logger.info(f"Found {len(data_store['systems'])} systems")
        logger.info(f"Found {len(data_store['formats'])} formats")
        logger.info(f"Found {len(data_store['interfaces'])} interfaces")
        
        # Initialisiere die erweiterte Suchmaschine
        global enhanced_searcher
        enhanced_searcher = EnhancedSearch(data_store)
        
        return True
    except Exception as e:
        logger.error(f"Error parsing XML file: {e}")
        return False


# Initialize data by parsing XML file
@app.on_event("startup")
async def startup_event():
    try:
        parse_xml_file("datenfluesse.xml")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        # Continue starting up even if parsing fails


# API endpoints
@app.get("/api/data-flows")
async def get_data_flows(
    source_system: Optional[str] = None,
    target_system: Optional[str] = None,
    format: Optional[str] = None,
    transmission_method: Optional[str] = None
):
    logger.info(f"Get data flows with filters: source={source_system}, target={target_system}, format={format}, method={transmission_method}")
    flows = data_store["data_flows"]
    
    # Apply filters if provided
    if source_system:
        flows = [flow for flow in flows if flow["source_system"] == source_system]
    
    if target_system:
        flows = [flow for flow in flows if flow["target_system"] == target_system]
    
    if format:
        flows = [flow for flow in flows if flow["format"] == format]
    
    if transmission_method:
        flows = [flow for flow in flows if transmission_method in flow["transmission_method"]]
    
    logger.info(f"Returning {len(flows)} flows after filtering")
    return flows


@app.get("/api/data-flows/{flow_id}")
async def get_data_flow(flow_id: str):
    logger.info(f"Looking for flow with ID: {flow_id}")
    for flow in data_store["data_flows"]:
        if flow["id"] == flow_id:
            return flow
    
    logger.warning(f"Flow with ID {flow_id} not found")
    raise HTTPException(status_code=404, detail="Data flow not found")


@app.get("/api/systems")
async def get_systems():
    logger.info(f"Returning {len(data_store['systems'])} systems")
    return list(data_store["systems"])


@app.get("/api/formats")
async def get_formats():
    logger.info(f"Returning {len(data_store['formats'])} formats")
    return list(data_store["formats"])


@app.get("/api/transmission-methods")
async def get_transmission_methods():
    logger.info(f"Returning {len(data_store['transmission_methods'])} transmission methods")
    return list(data_store["transmission_methods"])


@app.get("/api/interfaces")
async def get_interfaces():
    logger.info(f"Returning {len(data_store['interfaces'])} interfaces")
    return list(data_store["interfaces"])


# Verbesserte NLP-Suche
@app.post("/api/query")
async def natural_language_query(query_request: QueryRequest):
    query = query_request.query
    logger.info(f"Received NLP query: {query}")
    
    start_time = time.time()
    
    if enhanced_searcher:
        # Verwende die erweiterte Suchfunktion
        results = enhanced_searcher.search(query)
        logger.info(f"Enhanced search found {len(results['direct_results'])} direct results in {time.time() - start_time:.3f} seconds")
        return results
    else:
        # Fallback zur alten Suchfunktion, falls enhanced_searcher nicht initialisiert ist
        logger.warning("Enhanced searcher not initialized, falling back to basic search")
        return process_basic_query(query)


# Legacy-Endpunkt für Kompatibilität
@app.post("/query")
async def legacy_natural_language_query(request: Request):
    try:
        # Raw Body als Dict parsen
        body = await request.json()
        logger.info(f"Received raw request body: {body}")
        
        # Extract text field
        query_text = body.get("text", "")
        if not query_text:
            logger.warning("No 'text' field found in request")
            raise HTTPException(status_code=400, detail="Missing 'text' field in request")
        
        logger.info(f"Received legacy NLP query: {query_text}")
        
        if enhanced_searcher:
            # Verwende die erweiterte Suchfunktion
            results = enhanced_searcher.search(query_text)
            # Kompatibilität mit altem Format
            results["results"] = results["direct_results"]
            results["count"] = len(results["direct_results"])
            results["query"] = query_text
            return results
        else:
            # Fallback zur alten Suchfunktion
            return process_basic_query(query_text)
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")


# Einfache Suchmethode als Fallback
def process_basic_query(query: str):
    """
    Einfache Keyword-basierte Suche als Fallback
    """
    results = []
    query = query.lower()
    
    # Einfache Suche nach Übereinstimmungen in Namen, Beschreibungen, Systemen
    for flow in data_store["data_flows"]:
        score = 0
        
        # Prüfen auf Übereinstimmungen in verschiedenen Feldern
        if flow.get("name") and query in flow["name"].lower():
            score += 2
        
        if flow.get("description") and query in flow["description"].lower():
            score += 1
        
        if flow.get("source_system") and query in flow["source_system"].lower():
            score += 1.5
            
        if flow.get("target_system") and query in flow["target_system"].lower():
            score += 1.5
            
        if flow.get("format") and query in flow["format"].lower():
            score += 1.5
            
        if flow.get("transmission_method") and query in flow["transmission_method"].lower():
            score += 1
            
        # Schnittstellen durchsuchen
        if flow.get("process_steps"):
            for step in flow["process_steps"]:
                if step.get("interface") and query in step["interface"].lower():
                    score += 1
                    break
        
        # Wenn Score > 0, zu Ergebnissen hinzufügen
        if score > 0:
            flow_copy = flow.copy()
            flow_copy["search_score"] = score
            results.append(flow_copy)
    
    # Sortieren nach Score
    results.sort(key=lambda x: x.get("search_score", 0), reverse=True)
    
    # Verwandte Flüsse finden
    systems_in_results = set()
    for flow in results:
        if flow.get("source_system"):
            systems_in_results.add(flow["source_system"])
        if flow.get("target_system"):
            systems_in_results.add(flow["target_system"])
    
    related_flows = []
    for flow in data_store["data_flows"]:
        if flow not in results:
            if ((flow.get("source_system") and flow["source_system"] in systems_in_results) or
                (flow.get("target_system") and flow["target_system"] in systems_in_results)):
                related_flows.append(flow)
    
    # Einfache natürliche Antwort generieren
    if results:
        natural_response = f"Für die Suche nach '{query}' wurden {len(results)} relevante Datenflüsse gefunden."
    else:
        natural_response = f"Es wurden keine Datenflüsse gefunden, die zur Suche nach '{query}' passen."
    
    return {
        "direct_results": results,
        "related_flows": related_flows,
        "matching_systems": list(systems_in_results),
        "natural_response": natural_response,
        "results": results,  # Für Legacy-Kompatibilität
        "count": len(results),  # Für Legacy-Kompatibilität
        "query": query  # Für Legacy-Kompatibilität
    }


# Endpunkt zum Neuladen der Daten
@app.post("/api/reload")
async def reload_data():
    success = parse_xml_file("datenfluesse.xml")
    if success:
        return {"message": "Data reloaded successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to reload data")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
