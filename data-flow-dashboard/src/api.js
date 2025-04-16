// src/api.js
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Holt alle Datenflüsse mit optionalen Filterparametern
 * @param {Object} params - Optionale Filterparameter
 * @returns {Promise<Array>} - Liste von Datenflüssen
 */
export const fetchDataFlows = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `${API_BASE_URL}/data-flows?${queryParams}` : `${API_BASE_URL}/data-flows`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Datenflüsse: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};

/**
 * Holt einen spezifischen Datenfluss nach ID
 * @param {string} id - ID des Datenflusses
 * @returns {Promise<Object>} - Datenfluss-Objekt
 */
export const fetchDataFlow = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/data-flows/${id}`);
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen des Datenflusses mit ID ${id}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};

/**
 * Holt eine Liste aller Systeme
 * @returns {Promise<Array>} - Liste von Systemen
 */
export const fetchSystems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/systems`);
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Systeme: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};

/**
 * Holt eine Liste aller Formate
 * @returns {Promise<Array>} - Liste von Formaten
 */
export const fetchFormats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/formats`);
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Formate: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};

/**
 * Holt eine Liste aller Übertragungsmethoden
 * @returns {Promise<Array>} - Liste von Übertragungsmethoden
 */
export const fetchTransmissionMethods = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/transmission-methods`);
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Übertragungsmethoden: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};

/**
 * Führt eine natürlichsprachliche Abfrage durch
 * @param {string} query - Die Suchanfrage in natürlicher Sprache
 * @returns {Promise<Object>} - Ergebnisobjekt mit direkten und verwandten Treffern
 */
export const queryNaturalLanguage = async (query) => {
  console.log('Sende NLP-Anfrage:', query);
  try {
    // Versuche zuerst den neuen API-Endpunkt
    let url = `${API_BASE_URL}/query`;
    console.log('Versuche API-Endpunkt:', url);
    
    // Format für die zweite Implementierung
    let requestBody = { query: query };
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    // Bei 404 versuche den Legacy-Endpunkt
    if (!response.ok && response.status === 404) {
      url = `http://localhost:8000/query`;  // Ohne /api/ Präfix
      console.log('Versuche alternativen API-Endpunkt:', url);
      
      // Format für die erste Implementierung
      requestBody = { text: query };
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
    }
    
    if (!response.ok) {
      // Bei Fehler versuche detaillierte Informationen zu erhalten
      try {
        const errorText = await response.text();
        console.error('Server-Antwort bei Fehler:', errorText);
      } catch (e) {
        console.error('Konnte Fehlerdetails nicht lesen');
      }
      
      throw new Error(`Fehler bei der NLP-Abfrage: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('NLP-Antwort erhalten:', data);
    
    // Stelle sicher, dass die Antwort ein konsistentes Format hat
    return {
      direct_results: data.direct_results || data.results || [],
      related_flows: data.related_flows || [],
      matching_systems: data.matching_systems || [],
      natural_response: data.natural_response || `Gefunden: ${(data.direct_results || data.results || []).length} Datenflüsse`,
      count: data.count || (data.direct_results || data.results || []).length,
      query: data.query || query
    };
  } catch (error) {
    console.error('API-Fehler bei NLP:', error);
    throw error;
  }
};

/**
 * Holt alle Beziehungen für ein bestimmtes System
 * @param {string} systemName - Name des Systems
 * @returns {Promise<Object>} - Beziehungsdaten zum System
 */
export const fetchSystemRelationships = async (systemName) => {
  try {
    // Erstelle Parameter für Quell- und Zielsystem
    const params = new URLSearchParams();
    
    // Wir suchen nach Datenflüssen, bei denen das System entweder Quelle oder Ziel ist
    // Die API kombiniert diese Parameter logisch mit ODER
    params.append('source_system', systemName);
    params.append('target_system', systemName);
    
    const url = `${API_BASE_URL}/data-flows?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Systembeziehungen: ${response.status} ${response.statusText}`);
    }
    
    const flowsData = await response.json();
    
    // Strukturiertes Ergebnisobjekt mit zusätzlichen Informationen
    return {
      flows: flowsData,
      systemName,
      incomingFlows: flowsData.filter(flow => flow.target_system === systemName),
      outgoingFlows: flowsData.filter(flow => flow.source_system === systemName)
    };
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};

/**
 * Suche nach Datenflüssen, die eine bestimmte Schnittstelle verwenden
 * @param {string} interfaceName - Name der Schnittstelle
 * @returns {Promise<Array>} - Liste von Datenflüssen, die diese Schnittstelle verwenden
 */
export const findFlowsByInterface = async (interfaceName) => {
  try {
    // Da die API keinen direkten Endpunkt dafür hat, holen wir alle Flows
    // und filtern dann clientseitig
    const allFlows = await fetchDataFlows();
    
    // Filtern auf Clientseite
    return allFlows.filter(flow => {
      if (flow.process_steps && flow.process_steps.length > 0) {
        return flow.process_steps.some(step => 
          step.interface && step.interface.includes(interfaceName)
        );
      }
      return false;
    });
  } catch (error) {
    console.error('API-Fehler:', error);
    throw error;
  }
};