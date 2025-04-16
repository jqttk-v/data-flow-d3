// src/components/EnhancedDashboard.js
import React, { useState, useEffect } from 'react';
import ModeSelector from './ModeSelector';
import EnhancedNetworkGraph from './EnhancedNetworkGraph';
import AdaptiveDetailPanel from './AdaptiveDetailPanel';
import FilterBar from './FilterBar';
import SearchBar from './SearchBar';
import { fetchDataFlows, fetchSystems, fetchFormats, fetchTransmissionMethods, queryNaturalLanguage } from '../api';
import '../styles/EnhancedDashboard.css';
import DynamicFlowSequence from './DynamicFlowSequence';

const EnhancedDashboard = () => {
  // Main state variables
  const [dataFlows, setDataFlows] = useState([]);
  const [filteredFlows, setFilteredFlows] = useState([]);
  const [systems, setSystems] = useState([]);
  const [formats, setFormats] = useState([]);
  const [transmissionMethods, setTransmissionMethods] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  
  // Selection state
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [selectedDataFlowFilter, setSelectedDataFlowFilter] = useState(null);
  
  // UI state
  const [currentMode, setCurrentMode] = useState('overview'); // 'overview', 'focused', 'technical'
  const [currentView, setCurrentView] = useState('hierarchical'); // 'hierarchical', 'cluster'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nlpResponse, setNlpResponse] = useState(''); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Color palette
  const colorPalette = {
    primary: '#C63441',     // Red
    secondary: '#96BEBE',   // Light Teal
    tertiary: '#C0BCAC',    // Warm Gray
    accent1: '#E1BA50',     // Gold
    accent2: '#677488',     // Slate Blue
    background: '#ffffff',
    text: '#333333',
    lightGray: '#F5F5F7'
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [flowsData, systemsData, formatsData, methodsData] = await Promise.all([
          fetchDataFlows(),
          fetchSystems(),
          fetchFormats(),
          fetchTransmissionMethods()
        ]);
        
        setDataFlows(flowsData);
        setFilteredFlows(flowsData);
        setSystems(systemsData);
        setFormats(formatsData);
        setTransmissionMethods(methodsData);
        
        // Extract all unique interfaces from the dataFlows
        const extractedInterfaces = new Set();
        flowsData.forEach(flow => {
          if (flow.process_steps) {
            flow.process_steps.forEach(step => {
              if (step.interface) {
                extractedInterfaces.add(step.interface);
              }
            });
          }
        });
        setInterfaces(Array.from(extractedInterfaces));
        
        setLoading(false);
      } catch (err) {
        setError('Could not load data. Please try again later.');
        setLoading(false);
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
  }, []);

  // Handle mode change
  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    
    // Reset selections when changing modes
    if (mode === 'focused' && !selectedSystem) {
      // In focused mode, we might want to guide the user to select a system
      // Perhaps pre-select a main system
      const mainSystems = systems.filter(s => 
        s.includes('MIRA') || s.includes('GAS-X-GRID') || s.includes('VHP')
      );
      if (mainSystems.length > 0) {
        // Optionally pre-select the first main system in focused mode
        // setSelectedSystem(mainSystems[0]);
      }
    }
  };

  // Handle view change
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Handle search
  const handleSearch = async (query) => {
    try {
      setLoading(true);
      setSearchQuery(query);
      
      // Use natural language query API
      const results = await queryNaturalLanguage(query);
      console.log('NLP response received:', results);
      
      // Set natural language response
      if (results.natural_response) {
        setNlpResponse(results.natural_response);
      } else {
        // Fallback message
        const resultCount = (results.direct_results || []).length;
        setNlpResponse(`Your search returned ${resultCount} results.`);
      }
      
      // Split results into direct matches and related data flows
      const directResults = results.direct_results || results.results || [];
      const relatedFlows = results.related_flows || [];
      const matchingSystems = results.matching_systems || [];
      
      // Combine both types of results, but mark direct matches
      const allFlows = [
        ...directResults.map(flow => ({ ...flow, isDirectMatch: true })),
        ...relatedFlows.map(flow => ({ ...flow, isDirectMatch: false }))
      ];
      
      setFilteredFlows(allFlows);
      
      // If user searched for a system and exactly one was found, auto-select it
      if (matchingSystems.length === 1) {
        const system = matchingSystems[0];
        if (system && system.trim() !== '') {
          handleSystemSelect(system);
        } else {
          // Reset selections when searching
          setSelectedFlow(null);
          setSelectedSystem(null);
        }
      } else {
        // Reset selections if no unique system was found
        setSelectedFlow(null);
        setSelectedSystem(null);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
      setLoading(false);
      
      // Set informative error message as NLP response
      setNlpResponse(`An error occurred during search: ${err.message}`);
    }
  };

  // Handle filtering
  const handleFilter = async (filters) => {
    try {
      setLoading(true);
      setSearchQuery(''); // Reset search query when filtering
      setNlpResponse(''); // Reset NLP response
      
      // Create parameters for API request
      const params = {};
      
      if (filters.sourceSystem) {
        params.source_system = filters.sourceSystem;
      }
      
      if (filters.targetSystem) {
        params.target_system = filters.targetSystem;
      }
      
      if (filters.format) {
        params.format = filters.format;
      }
      
      if (filters.transmissionMethod) {
        params.transmission_method = filters.transmissionMethod;
      }
      
      // API request with filter parameters
      const results = await fetchDataFlows(params);
      
      // Mark filter results as direct matches
      const markedResults = results.map(flow => ({ ...flow, isDirectMatch: true }));
      setFilteredFlows(markedResults);
      
      // Reset selections when filtering
      setSelectedFlow(null);
      setSelectedSystem(null);
      
      setLoading(false);
    } catch (err) {
      setError('Filtering failed. Please try again.');
      console.error('Filter error:', err);
      setLoading(false);
    }
  };

  // Handle flow selection
  const handleFlowSelect = (flow) => {
    setSelectedFlow(flow);
    if (flow) {
      setSelectedSystem(null); // When a flow is selected, deselect system
      
      // In focused mode, we might want to show related systems
      if (currentMode === 'focused') {
        // Potentially update the UI to focus on the systems involved in this flow
        // This would depend on your specific requirements
      }
    }
  };

  // Handle system selection
  const handleSystemSelect = (system) => {
    setSelectedSystem(system);
    if (system) {
      setSelectedFlow(null); // When a system is selected, deselect flow
      
      // In focused mode, we would filter to show only flows related to this system
      if (currentMode === 'focused') {
        const relatedFlows = dataFlows.filter(
          flow => flow.source_system === system || flow.target_system === system
        );
        setFilteredFlows(relatedFlows.map(flow => ({ ...flow, isDirectMatch: true })));
      }
    }
  };

  // Handle PDF export
  const handleExportPDF = () => {
    alert('Export-to-PDF functionality would be implemented here');
    // In a real implementation, you would use a library like jsPDF
    // to generate a PDF from the current state of the visualization
  };

  // Handle clearing all filters and selections
  const handleClearFilters = () => {
    // Reset all filters and show all data flows
    setFilteredFlows(dataFlows);
    setSearchQuery('');
    setNlpResponse('');
    setSelectedFlow(null);
    setSelectedSystem(null);
    setSelectedDataFlowFilter(null);
  };

  // Helper function to determine system color
  const getSystemColor = (systemName) => {
    if (!systemName) return '#999999';
    
    if (systemName.includes('MIRA') || systemName.includes('MISA')) return colorPalette.primary;
    if (systemName.includes('Marktpartner')) return colorPalette.tertiary;
    if (systemName.includes('GAS-X-GRID')) return colorPalette.secondary;
    if (systemName.includes('GAS-X-BKN') || systemName.includes('GAS-X-BEN')) return colorPalette.accent1;
    if (systemName.includes('VHP')) return colorPalette.accent2;
    return '#999999';
  };

  // Helper function to get format color
  const getFormatColor = (format) => {
    if (!format) return '#CCCCCC';
    
    switch (format) {
      case 'NOMINT': return '#C63441';
      case 'CONTRL': return '#677488';
      case 'APERAK': return '#96BEBE';
      case 'ACKNOW': return '#E1BA50';
      case 'NOMRES': return '#C0BCAC';
      case 'ALOCAT': return '#E18B50';
      case 'INVOIC': return '#E1BA50';
      default: return '#CCCCCC';
    }
  };

  // Loading indicator
  if (loading) {
    return <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading data...</div>
    </div>;
  }

  // Error display
  if (error) {
    return <div className="error-message">
      <div className="error-icon">⚠️</div>
      <div className="error-text">{error}</div>
      <button className="retry-button" onClick={() => window.location.reload()}>Retry</button>
    </div>;
  }

  return (
    <div className="enhanced-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-button" onClick={toggleSidebar}>
            <span className="menu-icon">☰</span>
          </button>
          <h1>Data Flow Dashboard</h1>
        </div>
        
        <ModeSelector 
          currentMode={currentMode} 
          onModeChange={handleModeChange} 
          colorPalette={colorPalette} 
        />
        
        {searchQuery && (
          <div className="active-search">
            <span>Active search: {searchQuery}</span>
            <button onClick={handleClearFilters} className="clear-button">Reset</button>
          </div>
        )}
      </header>
      
      <div className="search-filter-container">
        <div className="search-container">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        <FilterBar 
          systems={systems}
          formats={formats}
          transmissionMethods={transmissionMethods}
          onFilter={handleFilter}
          onClear={handleClearFilters}
          colorPalette={colorPalette}
        />
        
        {/* Mode description */}
        <div className="mode-description-banner">
          <strong>{currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode:</strong> {
            currentMode === 'overview' ? 'Complete view of all systems, data flows, and interfaces' :
            currentMode === 'focused' ? 'Filtered view for specific business contexts' :
            'Detailed technical information and diagnostics'
          }
        </div>
        
        {/* Mode-specific controls */}
        {currentMode === 'focused' && (
          <div className="focused-mode-controls">
            <div className="focused-mode-selectors">
              <div className="selector-group">
                <label>System Focus:</label>
                <select 
                  value={selectedSystem || ''} 
                  onChange={(e) => {
                    const system = e.target.value;
                    if (system) {
                      handleSystemSelect(system);
                    } else {
                      setSelectedSystem(null);
                    }
                  }}
                  className="focus-selector"
                >
                  <option value="">Select a System</option>
                  {systems.map(system => (
                    <option key={system} value={system}>
                      {system}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="selector-group">
                <label>Data Flow:</label>
                <select 
                  value={selectedDataFlowFilter || ''}
                  onChange={(e) => {
                    const flowId = e.target.value;
                    setSelectedDataFlowFilter(flowId);
                    if (flowId) {
                      const flow = dataFlows.find(f => f.id === flowId);
                      if (flow) {
                        handleFlowSelect(flow);
                      }
                    } else {
                      setSelectedFlow(null);
                    }
                  }}
                  className="focus-selector"
                  disabled={!selectedSystem}
                >
                  <option value="">All Data Flows</option>
                  {dataFlows
                    .filter(flow => 
                      !selectedSystem || 
                      flow.source_system === selectedSystem || 
                      flow.target_system === selectedSystem
                    )
                    .map(flow => (
                      <option key={flow.id} value={flow.id}>
                        {flow.name || flow.id} ({flow.format || 'Unknown'})
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
            
            <div className="focused-mode-info">
              {selectedSystem && (
                <div className="focused-system-info">
                  <div className="system-badge" style={{ backgroundColor: getSystemColor(selectedSystem) }}>
                    {selectedSystem}
                  </div>
                  <div className="system-stats">
                    <div className="stat-item">
                      <span className="stat-label">Incoming Flows:</span>
                      <span className="stat-value">
                        {dataFlows.filter(f => f.target_system === selectedSystem).length}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Outgoing Flows:</span>
                      <span className="stat-value">
                        {dataFlows.filter(f => f.source_system === selectedSystem).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedFlow && (
                <div className="focused-flow-info">
                  <div className="flow-format-badge" style={{ backgroundColor: getFormatColor(selectedFlow.format) }}>
                    {selectedFlow.format || 'Unknown Format'}
                  </div>
                  <div className="flow-route">
                    {selectedFlow.source_system} → {selectedFlow.target_system}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {currentMode === 'technical' && (
          <div className="technical-mode-controls">
            <div className="technical-header">
              <h4>Technical Diagnostics</h4>
            </div>
            
            
            {selectedFlow && (
  <div className="technical-metrics">
    <div className="metrics-header">Technische Metriken: {selectedFlow.id}</div>
    <div className="metrics-grid">
      
      <div className="metric-card">
        <div className="metric-label">Status</div>
        <div className="metric-value status-ok">Operational</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Servername</div>
        <div className="metric-value">{selectedFlow.serverName || "inubit MIRA01P"}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">IP-Adresse</div>
        <div className="metric-value">{selectedFlow.serverIp || "10.60.46.61:8000/"}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Protokoll</div>
        <div className="metric-value">{selectedFlow.protocol || "HTTPS//SOAP"}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Version</div>
        <div className="metric-value">{selectedFlow.lastRun || "v8.0.16"}</div>
      </div>

    </div>
  </div>
)}

          </div>
        )}
      </div>
      
      <main className="dashboard-content">
        {nlpResponse && (
          <div className="nlp-response-banner" style={{ backgroundColor: colorPalette.accent1 }}>
            <p>{nlpResponse}</p>
          </div>
        )}
        
        <div className="content-wrapper">
          {sidebarOpen && (
            <div className="left-panel">
              <div className="left-panel-header">
                <h3>Process Steps</h3>
                {filteredFlows.length > 0 && (
                  <p className="results-count">{filteredFlows.length} Results</p>
                )}
              </div>
              
              <div className="process-steps-panel">
                <div className="process-step-item active">
                  <div className="step-number">1</div>
                  <div className="step-details">
                    <div className="step-name">NOMINT</div>
                    <div className="step-description">Send nomination data</div>
                  </div>
                </div>
                
                <div className="process-step-item">
                  <div className="step-number">2</div>
                  <div className="step-details">
                    <div className="step-name">APERAK</div>
                    <div className="step-description">Receive confirmation</div>
                  </div>
                </div>
                
                <div className="process-step-item">
                  <div className="step-number">3</div>
                  <div className="step-details">
                    <div className="step-name">ALOCAT</div>
                    <div className="step-description">Allocation data</div>
                  </div>
                </div>
                
                <div className="process-step-item">
                  <div className="step-number">4</div>
                  <div className="step-details">
                    <div className="step-name">INVOIC</div>
                    <div className="step-description">Billing data</div>
                  </div>
                </div>
              </div>
              
              {/* Format legend */}
              <div className="sidebar-format-legend">
                <h4>Format Legend</h4>
                <div className="format-badges">
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('NOMINT') }}></div>
                    <div className="format-name">NOMINT</div>
                  </div>
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('APERAK') }}></div>
                    <div className="format-name">APERAK</div>
                  </div>
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('NOMRES') }}></div>
                    <div className="format-name">NOMRES</div>
                  </div>
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('CONTRL') }}></div>
                    <div className="format-name">CONTRL</div>
                  </div>
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('ACKNOW') }}></div>
                    <div className="format-name">ACKNOW</div>
                  </div>
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('ALOCAT') }}></div>
                    <div className="format-name">ALOCAT</div>
                  </div>
                  <div className="format-badge-item">
                    <div className="format-color" style={{ backgroundColor: getFormatColor('INVOIC') }}></div>
                    <div className="format-name">INVOIC</div>
                  </div>
                </div>
              </div>
              
              {/* Mode-specific sidebar content */}
              {currentMode === 'overview' && (
                <div className="mode-info-panel">
                  <h4>Overview Mode</h4>
                  <p>View the complete process structure and data flow relationships.</p>
                </div>
              )}
              
              {currentMode === 'focused' && (
                <div className="mode-info-panel">
                  <h4>Focused Mode</h4>
                  <p>Select a system to focus on its specific data flows and business context.</p>
                  <div className="system-quick-select">
                    <h5>Quick Select:</h5>
                    <div className="quick-select-buttons">
                      {systems.slice(0, 4).map(system => (
                        <button 
                          key={system}
                          className={`quick-select-button ${selectedSystem === system ? 'active' : ''}`}
                          onClick={() => handleSystemSelect(system)}
                          style={{ 
                            backgroundColor: selectedSystem === system ? 
                              getSystemColor(system) : '#f5f5f5',
                            color: selectedSystem === system ? 'white' : '#333'
                          }}
                        >
                          {system}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {currentMode === 'technical' && (
                <div className="mode-info-panel">
                  <h4>Technical Mode</h4>
                  <p>Access detailed technical specifications and diagnostic information.</p>
                  <div className="technical-tools">
                    <h5>Technical Tools:</h5>
                    <div className="tool-buttons">
                      <button className="tool-button">Run Diagnostic</button>
                      <button className="tool-button">View Schema</button>
                      <button className="tool-button">Flow Logs</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="right-panel">
            <div className="visualization-container">
              <EnhancedNetworkGraph 
                dataFlows={filteredFlows} 
                systems={systems}
                interfaces={interfaces}
                currentMode={currentMode}
                currentView={currentView}
                onSelectFlow={handleFlowSelect}
                onSelectSystem={handleSystemSelect}
                selectedFlow={selectedFlow}
                selectedSystem={selectedSystem}
                colorPalette={colorPalette}
              />
            </div>
            {selectedFlow && (
              <div className="dynamic-sequence-container">
                <h3 className="section-title">Datenfluss-Ablauf</h3>
                <DynamicFlowSequence 
                  dataFlow={selectedFlow} 
                  colorPalette={colorPalette} 
                />
              </div>
            )}
            
            <AdaptiveDetailPanel 
              currentMode={currentMode}
              selectedFlow={selectedFlow}
              selectedSystem={selectedSystem}
              dataFlows={dataFlows}
              filteredFlows={filteredFlows}
              onSelectFlow={handleFlowSelect}
              onSelectSystem={handleSystemSelect}
              onExportPDF={handleExportPDF}
              colorPalette={colorPalette}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancedDashboard;