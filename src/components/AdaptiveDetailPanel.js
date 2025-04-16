// src/components/AdaptiveDetailPanel.js - Key improvements
import React, { useState, useEffect } from 'react';
import '../styles/AdaptiveDetailPanel.css';

const AdaptiveDetailPanel = ({ 
  currentMode, 
  selectedFlow, 
  selectedSystem, 
  dataFlows = [], 
  filteredFlows = [],
  onSelectFlow,
  onSelectSystem, 
  onExportPDF, 
  colorPalette 
}) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [relatedFlows, setRelatedFlows] = useState([]);
  const [technicalDetails, setTechnicalDetails] = useState(null);

  // Manage related flows based on selected system
  useEffect(() => {
    if (selectedSystem && dataFlows) {
      const flows = dataFlows.filter(flow => 
        flow.source_system === selectedSystem || flow.target_system === selectedSystem
      );
      
      // Sort by source and target system for better organization
      const sortedFlows = flows.sort((a, b) => {
        // Prioritize flows where the selected system is the source
        const aIsSource = a.source_system === selectedSystem;
        const bIsSource = b.source_system === selectedSystem;
        
        if (aIsSource && !bIsSource) return -1;
        if (!aIsSource && bIsSource) return 1;
        
        // Otherwise sort by name
        return a.name.localeCompare(b.name);
      });
      
      setRelatedFlows(sortedFlows);
    } else {
      setRelatedFlows([]);
    }
  }, [selectedSystem, dataFlows]);

  // When a flow is selected, automatically expand basic info
  useEffect(() => {
    if (selectedFlow) {
      setExpandedSection('basic');
      
      // Generate technical details for technical mode
      if (currentMode === 'technical') {
        generateTechnicalDetails(selectedFlow);
      }
    }
  }, [selectedFlow, currentMode]);

  // Generate mock technical details for demonstration
  const generateTechnicalDetails = (flow) => {
    // In a real app, this would fetch real technical data
    const details = {
      status: Math.random() > 0.9 ? 'error' : 'operational',
      latency: Math.floor(Math.random() * 200) + 50,
      throughput: Math.floor(Math.random() * 1000) + 100,
      lastExecuted: new Date().toISOString(),
      processingSteps: flow.process_steps ? flow.process_steps.length : 0,
      validations: Math.floor(Math.random() * 5) + 1,
      interfaceVersions: {
        current: '1.2.3',
        supported: ['1.2.0', '1.2.1', '1.2.2', '1.2.3']
      },
      dataFields: [
        { name: 'ShipperCode', type: 'String(10)', required: true, validation: 'alphanumeric' },
        { name: 'GasDay', type: 'Date', required: true, validation: 'date' },
        { name: 'BalanceGroupEIC', type: 'String(16)', required: true, validation: 'EIC-code' },
        { name: 'GasQuantity', type: 'Decimal', required: true, validation: 'numeric' }
      ]
    };
    
    setTechnicalDetails(details);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getSystemColor = (systemName) => {
    if (!systemName) return '#999999';
    
    if (systemName.includes('MIRA') || systemName.includes('MISA')) return colorPalette.primary;
    if (systemName.includes('Marktpartner')) return colorPalette.tertiary;
    if (systemName.includes('GAS-X-GRID')) return colorPalette.secondary;
    if (systemName.includes('GAS-X-BKN') || systemName.includes('GAS-X-BEN')) return colorPalette.accent1;
    if (systemName.includes('VHP')) return colorPalette.accent2;
    return '#999999';
  };

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

  // Helper function to get format description
  const getFormatDescription = (format) => {
    switch (format) {
      case 'NOMINT': 
        return "NOMINT is a format for transmitting nominations (gas quantity registrations) between market participants.";
      case 'NOMRES': 
        return "NOMRES is a format for nomination confirmations used in response to NOMINT messages.";
      case 'CONTRL': 
        return "CONTRL is a format for syntax confirmations that confirms the correct receipt of an EDI message.";
      case 'APERAK': 
        return "APERAK is a format for error messages used for syntactic or content problems in a message.";
      case 'ACKNOW': 
        return "ACKNOW is a format for processing confirmations that communicates the status of request processing.";
      case 'ALOCAT': 
        return "ALOCAT is a format for transmitting allocation data for gas quantities between network operators and market partners.";
      case 'INVOIC':
        return "INVOIC is a format for billing data, communicating information about a commercial invoice.";
      default: 
        return "";
    }
  };

  // Generate breadcrumbs
  const renderBreadcrumbs = () => {
    const parts = [];
    parts.push("Dashboard");
    
    if (currentMode !== 'overview') {
      parts.push(currentMode.charAt(0).toUpperCase() + currentMode.slice(1) + " Mode");
    }
    
    if (selectedSystem) {
      parts.push(selectedSystem);
    }
    
    if (selectedFlow) {
      if (selectedSystem) {
        if (selectedFlow.source_system === selectedSystem) {
          parts.push("Outgoing Flows");
        } else {
          parts.push("Incoming Flows");
        }
      }
      parts.push(selectedFlow.name || selectedFlow.id);
    }
    
    return (
      <div className="breadcrumbs">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="breadcrumb-separator">&gt;</span>}
            <span className="breadcrumb-part">{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render the appropriate detail panel based on current mode
  const renderDetailContent = () => {
    // If nothing is selected
    if (!selectedFlow && !selectedSystem) {
      return (
        <div className="welcome-message">
          <h4>Welcome to the Data Flow Dashboard</h4>
          <p>
            Use the search or filters to find data flows. 
            Click on systems or data flows in the visualization 
            to display details.
          </p>
          
          <div className="legend">
            <h5>Legend:</h5>
            <div className="legend-grid">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colorPalette.primary }}></div>
                <div className="legend-label">MIRA/MISA Systems</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colorPalette.secondary }}></div>
                <div className="legend-label">GAS-X-GRID Systems</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colorPalette.accent1 }}></div>
                <div className="legend-label">GAS-X-BKN/BEN Systems</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colorPalette.accent2 }}></div>
                <div className="legend-label">VHP Systems</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colorPalette.tertiary }}></div>
                <div className="legend-label">Market Partner Systems</div>
              </div>
            </div>
          </div>
          
          <div className="format-legend">
            <h5>Format Legend:</h5>
            <div className="format-legend-grid">
              <div className="format-badge" style={{ backgroundColor: getFormatColor('NOMINT') }}>
                NOMINT - Nomination
              </div>
              <div className="format-badge" style={{ backgroundColor: getFormatColor('NOMRES') }}>
                NOMRES - Nomination Confirmation
              </div>
              <div className="format-badge" style={{ backgroundColor: getFormatColor('CONTRL') }}>
                CONTRL - Control Message
              </div>
              <div className="format-badge" style={{ backgroundColor: getFormatColor('APERAK') }}>
                APERAK - Error Message
              </div>
              <div className="format-badge" style={{ backgroundColor: getFormatColor('ACKNOW') }}>
                ACKNOW - Confirmation
              </div>
              <div className="format-badge" style={{ backgroundColor: getFormatColor('ALOCAT') }}>
                ALOCAT - Allocation
              </div>
              <div className="format-badge" style={{ backgroundColor: getFormatColor('INVOIC') }}>
                INVOIC - Invoice
              </div>
            </div>
          </div>
          
          <div className="mode-tips">
            <h5>Mode Tips:</h5>
            <ul>
              <li><strong>Overview:</strong> Complete visualization of all systems and data flows</li>
              <li><strong>Focused:</strong> Filtered view for specific business contexts</li>
              <li><strong>Technical:</strong> Detailed technical information and diagnostics</li>
            </ul>
          </div>
        </div>
      );
    }
    
    // If a system is selected
    if (selectedSystem && !selectedFlow) {
      return renderSystemDetail();
    }
    
    // If a flow is selected
    if (selectedFlow) {
      // Different detail views based on mode
      if (currentMode === 'overview') {
        return renderFlowOverview();
      } else if (currentMode === 'focused') {
        return renderFlowFocused();
      } else if (currentMode === 'technical') {
        return renderFlowTechnical();
      }
    }
    
    return <p>Select an element to view details</p>;
  };

  // Render system detail view
  const renderSystemDetail = () => {
    return (
      <div className="system-detail-view">
        {renderBreadcrumbs()}
        
        <div className="system-header">
          <div className="system-icon" style={{ backgroundColor: getSystemColor(selectedSystem) }}>
            {selectedSystem ? selectedSystem.charAt(0) : '?'}
          </div>
          <div className="system-info">
            <div className="system-name">{selectedSystem}</div>
            <div className="system-type">
              {selectedSystem.includes('MIRA') || selectedSystem.includes('MISA') ? "Market Partner System" :
               selectedSystem.includes('GAS-X-GRID') ? "Network Operation System" :
               selectedSystem.includes('GAS-X-BKN') || selectedSystem.includes('GAS-X-BEN') ? "Balance Group Network System" :
               selectedSystem.includes('VHP') ? "Virtual Hub Portal" :
               selectedSystem.includes('Marktpartner') ? "External Market Partner System" :
               "System Component"}
            </div>
          </div>
        </div>
        
        {/* System Role and Description */}
        <div className="system-description-box">
          <strong>System Role:</strong> {
            selectedSystem.includes('MIRA') || selectedSystem.includes('MISA') ? "Central nomination system for gas distribution" :
            selectedSystem.includes('GAS-X-GRID') ? "Network operation system for transport capacities" :
            selectedSystem.includes('GAS-X-BKN') || selectedSystem.includes('GAS-X-BEN') ? "Balance group network system for processing balance data" :
            selectedSystem.includes('VHP') ? "Virtual Hub Portal for market activities" :
            selectedSystem.includes('Marktpartner') ? "External system of a market partner" :
            "System component"
          }
        </div>
        
        {/* Display connections as system map */}
        <div className="system-connections-map">
          <h4>System Relationships</h4>
          <div className="system-map">
            {relatedFlows.length > 0 ? (
              <div className="system-map-content">
                {/* Group connections by source and target system */}
                <div className="system-map-flows">
                  <div className="incoming-flows">
                    <h5 className="flow-direction-header">
                      Incoming Flows ({relatedFlows.filter(flow => flow.target_system === selectedSystem).length})
                    </h5>
                    {relatedFlows
                      .filter(flow => flow.target_system === selectedSystem)
                      .map((flow) => (
                        <div 
                          key={flow.id} 
                          className="system-map-connection"
                          onClick={() => onSelectFlow(flow)}
                        >
                          <div className="source-system" style={{ backgroundColor: getSystemColor(flow.source_system) }}>
                            {flow.source_system}
                          </div>
                          <div className="flow-arrow incoming">
                            <svg width="50" height="20" viewBox="0 0 50 20">
                              <path d="M0,10 H40 M35,5 L45,10 L35,15" fill="none" stroke="#666" strokeWidth="2" />
                            </svg>
                          </div>
                          <div className="format-badge" style={{ backgroundColor: getFormatColor(flow.format) }}>
                            {flow.format}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  <div className="selected-system-container">
                    <div className="selected-system-box" style={{ backgroundColor: getSystemColor(selectedSystem) }}>
                      {selectedSystem}
                    </div>
                  </div>
                  
                  <div className="outgoing-flows">
                    <h5 className="flow-direction-header">
                      Outgoing Flows ({relatedFlows.filter(flow => flow.source_system === selectedSystem).length})
                    </h5>
                    {relatedFlows
                      .filter(flow => flow.source_system === selectedSystem)
                      .map((flow) => (
                        <div 
                          key={flow.id} 
                          className="system-map-connection"
                          onClick={() => onSelectFlow(flow)}
                        >
                          <div className="flow-arrow outgoing">
                            <svg width="50" height="20" viewBox="0 0 50 20">
                              <path d="M0,10 H40 M35,5 L45,10 L35,15" fill="none" stroke="#666" strokeWidth="2" />
                            </svg>
                          </div>
                          <div className="target-system" style={{ backgroundColor: getSystemColor(flow.target_system) }}>
                            {flow.target_system}
                          </div>
                          <div className="format-badge" style={{ backgroundColor: getFormatColor(flow.format) }}>
                            {flow.format}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>No system connections found.</p>
            )}
          </div>
        </div>
        
        {/* System metrics - only shown in technical mode */}
        {currentMode === 'technical' && (
          <div className="system-metrics">
            <h4>System Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-title">Status</div>
                <div className="metric-value status-ok">Operational</div>
              </div>
              <div className="metric-card">
                <div className="metric-title">Uptime</div>
                <div className="metric-value">99.97%</div>
              </div>
              <div className="metric-card">
                <div className="metric-title">Flow Count</div>
                <div className="metric-value">{relatedFlows.length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-title">Response Time</div>
                <div className="metric-value">127ms</div>
              </div>
            </div>
          </div>
        )}
        
        <h4>Connected Data Flows ({relatedFlows.length})</h4>
        
        {relatedFlows.length > 0 ? (
          <ul className="related-flows-list">
            {relatedFlows.map((flow) => (
              <li 
                key={flow.id} 
                className="related-flow-item"
                onClick={() => onSelectFlow(flow)}
              >
                <div className="flow-icon" style={{ backgroundColor: getFormatColor(flow.format) }}>
                  {flow.format ? flow.format.charAt(0) : '?'}
                </div>
                <div className="flow-details">
                  <div className="flow-name">{flow.name}</div>
                  <div className="flow-format">
                    {flow.format} | {flow.source_system} → {flow.target_system}
                  </div>
                  <div className="flow-description">
                    <small>{flow.description}</small>
                  </div>
                </div>
                <div className="flow-direction-icon">
                  {flow.source_system === selectedSystem ? (
                    <span className="outgoing-icon" title="Outgoing Data Flow">→</span>
                  ) : (
                    <span className="incoming-icon" title="Incoming Data Flow">←</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No data flows found.</p>
        )}
      </div>
    );
  };

  // Render flow detail for overview mode (business-oriented)
  const renderFlowOverview = () => {
    if (!selectedFlow) return <p>No data flow selected</p>;
    
    return (
      <>
        {renderBreadcrumbs()}
        
        {/* Status display */}
        <div className="flow-status-bar">
          <div className="flow-status-left">
            <span className="format-badge" style={{ 
              backgroundColor: getFormatColor(selectedFlow.format),
              marginBottom: 0
            }}>
              {selectedFlow.format}
            </span>
            
            <span className="status-badge">
              Active
            </span>
          </div>
          <div className="flow-id">
            ID: {selectedFlow.id}
          </div>
        </div>
        
        <div 
          className={`detail-section ${expandedSection === 'basic' ? 'expanded' : ''}`}
          onClick={() => toggleSection('basic')}
        >
          <h4>Basic Information</h4>
          {expandedSection === 'basic' ? (
            <div className="section-content">
              <p><strong>Name:</strong> {selectedFlow.name}</p>
              <p><strong>Description:</strong> {selectedFlow.description}</p>
              <p><strong>Transmission Method:</strong> {selectedFlow.transmission_method}</p>
              <p><strong>Format:</strong> <span className="format-inline-badge" style={{ 
                backgroundColor: getFormatColor(selectedFlow.format)
              }}>{selectedFlow.format}</span></p>
              <p><strong>Trigger:</strong> {selectedFlow.trigger}</p>
              
              {/* Format and transmission information */}
              {getFormatDescription(selectedFlow.format) && (
                <div className="info-box">
                  <p><strong>Format Info:</strong> {getFormatDescription(selectedFlow.format)}</p>
                </div>
              )}
              
              <span className="collapse-hint">Click to collapse</span>
            </div>
          ) : (
            <div className="section-preview">
              <p>{selectedFlow.description}</p>
              <span className="expand-hint">Click to expand</span>
            </div>
          )}
        </div>
        
        <div 
          className={`detail-section ${expandedSection === 'systems' ? 'expanded' : ''}`}
          onClick={() => toggleSection('systems')}
        >
          <h4>Systems</h4>
          {expandedSection === 'systems' ? (
            <div className="section-content">
              <div className="system-flow">
                <div 
                  className="system-box source-system" 
                  style={{ backgroundColor: getSystemColor(selectedFlow.source_system) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFlow(null);
                    onSelectSystem(selectedFlow.source_system);
                  }}
                >
                  {selectedFlow.source_system}
                </div>
                <div className="flow-arrow">
                  <svg width="80" height="30" viewBox="0 0 80 30">
                    <defs>
                      <marker id="arrowhead-detail" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                      </marker>
                    </defs>
                    <path 
                      d="M0,15 H70" 
                      fill="none" 
                      stroke="#666" 
                      strokeWidth="2" 
                      markerEnd="url(#arrowhead-detail)" 
                    />
                    <text x="35" y="12" textAnchor="middle" fontSize="12" fill={getFormatColor(selectedFlow.format)}>
                      {selectedFlow.format}
                    </text>
                  </svg>
                </div>
                <div 
                  className="system-box target-system" 
                  style={{ backgroundColor: getSystemColor(selectedFlow.target_system) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFlow(null);
                    onSelectSystem(selectedFlow.target_system);
                  }}
                >
                  {selectedFlow.target_system}
                </div>
              </div>
              
              {/* System information */}
              <div className="systems-info-grid">
                <div className="system-info-card">
                  <h5>Source System</h5>
                  <p><strong>{selectedFlow.source_system}</strong></p>
                  <p className="system-info-description">
                    Responsible for providing data in {selectedFlow.format} format.
                  </p>
                </div>
                
                <div className="system-info-card">
                  <h5>Target System</h5>
                  <p><strong>{selectedFlow.target_system}</strong></p>
                  <p className="system-info-description">
                    Receives and processes {selectedFlow.format} data for further workflows.
                  </p>
                </div>
              </div>
              
              <span className="collapse-hint">Click to collapse</span>
            </div>
          ) : (
            <div className="section-preview">
              <p>{selectedFlow.source_system} → {selectedFlow.target_system}</p>
              <span className="expand-hint">Click to expand</span>
            </div>
          )}
        </div>
        
        <div 
          className={`detail-section ${expandedSection === 'process' ? 'expanded' : ''}`}
          onClick={() => toggleSection('process')}
        >
          <h4>Process Steps</h4>
          {expandedSection === 'process' ? (
            <div className="section-content">
              {selectedFlow.process_steps && selectedFlow.process_steps.length > 0 ? (
                <>
                  {/* Enhanced visual process step representation */}
                  <div className="process-flow-visualization">
                    {selectedFlow.process_steps.map((step, index) => (
                      <React.Fragment key={index}>
                        <div className="process-node">
                          <div className="step-number">{index + 1}</div>
                          <div className="step-type">{step.step_type}</div>
                          {index < selectedFlow.process_steps.length - 1 && (
                            <div className="process-node-arrow">
                              <svg width="30" height="20" viewBox="0 0 30 20">
                                <path 
                                  d="M0,10 H20 M15,5 L25,10 L15,15" 
                                  fill="none" 
                                  stroke="#666" 
                                  strokeWidth="2" 
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* List of all process steps */}
                  <div className="process-steps">
                    {selectedFlow.process_steps.map((step, index) => (
                      <div 
                        key={index} 
                        className="process-step"
                      >
                        <div className="step-number">{index + 1}</div>
                        <div className="step-details">
                          <div className="step-type">{step.step_type}</div>
                          <div className="step-interface">{step.interface}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // Improved display for flows without process steps
                <div>
                  <p>This data flow does not use specific process steps. The data is transmitted directly.</p>
                  
                  <div className="direct-flow-visualization">
                    <div className="direct-flow-systems">
                      <div className="system-box" style={{ 
                        backgroundColor: getSystemColor(selectedFlow.source_system),
                      }}>
                        {selectedFlow.source_system}
                      </div>
                      
                      <div className="direct-flow-arrow">
                        <svg width="80" height="40" viewBox="0 0 80 40">
                          <defs>
                            <marker id="directArrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                            </marker>
                          </defs>
                          <path d="M0,20 H70" stroke="#666" strokeWidth="2" markerEnd="url(#directArrow)" />
                          <text x="35" y="15" textAnchor="middle" fontSize="12" fill={getFormatColor(selectedFlow.format)}>
                            {selectedFlow.format}
                          </text>
                          <text x="35" y="35" textAnchor="middle" fontSize="10">
                            {selectedFlow.transmission_method}
                          </text>
                        </svg>
                      </div>
                      
                      <div className="system-box" style={{ 
                        backgroundColor: getSystemColor(selectedFlow.target_system),
                      }}>
                        {selectedFlow.target_system}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <span className="collapse-hint">Click to collapse</span>
            </div>
          ) : (
            <div className="section-preview">
              <p>{selectedFlow.process_steps ? `${selectedFlow.process_steps.length} Steps` : 'Direct transmission (no process steps)'}</p>
              <span className="expand-hint">Click to expand</span>
            </div>
          )}
        </div>
      </>
    );
  };

  // Render flow detail for focused mode (business context)
  const renderFlowFocused = () => {
    if (!selectedFlow) return <p>No data flow selected</p>;
    
    // Find business context for this flow
    const getBusinessContext = () => {
      if (selectedFlow.format === 'NOMINT') {
        return {
          process: 'Gas Nomination',
          purpose: 'Initiating gas delivery by specifying required quantities',
          businessValue: 'Ensures timely gas delivery according to requirements',
          stakeholders: ['Gas Trader', 'Network Operator', 'Balance Manager'],
          kpis: ['Nomination Accuracy', 'Processing Time', 'Confirmation Rate']
        };
      } else if (selectedFlow.format === 'APERAK') {
        return {
          process: 'Error Handling',
          purpose: 'Communicating processing errors for correction',
          businessValue: 'Prevents delivery failures through early error detection',
          stakeholders: ['Gas Trader', 'Network Operator', 'IT Support'],
          kpis: ['Error Resolution Time', 'Error Rate', 'Process Recovery']
        };
      } else if (selectedFlow.format === 'ALOCAT') {
        return {
          process: 'Gas Allocation',
          purpose: 'Distributing gas quantities to balance groups',
          businessValue: 'Ensures correct billing and balance management',
          stakeholders: ['Balance Manager', 'Grid Operator', 'Trader'],
          kpis: ['Allocation Accuracy', 'Timeliness', 'Balance Group Stability']
        };
      } else if (selectedFlow.format === 'INVOIC') {
        return {
          process: 'Billing',
          purpose: 'Creating and transmitting invoice information',
          businessValue: 'Ensures timely and accurate financial settlement',
          stakeholders: ['Accounting', 'Market Partner', 'Financial Controller'],
          kpis: ['Invoice Accuracy', 'Processing Time', 'Payment Rate']
        };
      }
      
      return {
        process: 'Gas Market Communication',
        purpose: 'Exchanging structured data between market participants',
        businessValue: 'Ensures efficient and standardized market processes',
        stakeholders: ['Gas Trader', 'Network Operator', 'Market Participants'],
        kpis: ['Process Efficiency', 'Data Quality', 'Compliance']
      };
    };
    
    const businessContext = getBusinessContext();
    
    return (
      <>
        {renderBreadcrumbs()}
        
        {/* Status and business process display */}
        <div className="flow-status-bar">
          <div className="flow-status-left">
            <span className="format-badge" style={{ 
              backgroundColor: getFormatColor(selectedFlow.format),
              marginBottom: 0
            }}>
              {selectedFlow.format}
            </span>
            
            <span className="context-badge">
              {businessContext.process}
            </span>
          </div>
          <div className="flow-id">
            ID: {selectedFlow.id}
          </div>
        </div>
        
        {/* Business context section */}
        <div className="business-context">
          <h4>Business Context</h4>
          <div className="context-content">
            <div className="context-row">
              <div className="context-label">Purpose:</div>
              <div className="context-value">{businessContext.purpose}</div>
            </div>
            <div className="context-row">
              <div className="context-label">Business Value:</div>
              <div className="context-value">{businessContext.businessValue}</div>
            </div>
            <div className="context-row">
              <div className="context-label">Key Stakeholders:</div>
              <div className="context-value">
                <div className="stakeholders-list">
                  {businessContext.stakeholders.map((stakeholder, index) => (
                    <span key={index} className="stakeholder-badge">{stakeholder}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="context-row">
              <div className="context-label">KPIs:</div>
              <div className="context-value">
                <div className="kpi-list">
                  {businessContext.kpis.map((kpi, index) => (
                    <span key={index} className="kpi-badge">{kpi}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Process visualization with business context */}
        <div className="business-process-visualization">
          <h4>Process Flow</h4>
          <div className="business-process-diagram">
            {selectedFlow.process_steps && selectedFlow.process_steps.length > 0 ? (
              <div className="process-steps-flow">
                {selectedFlow.process_steps.map((step, index) => (
                  <div key={index} className="business-process-step">
                    <div className="business-step-number">{index + 1}</div>
                    <div className="business-step-content">
                      <div className="business-step-name">{step.step_type}</div>
                      <div className="business-step-interface">{step.interface}</div>
                    </div>
                    {index < selectedFlow.process_steps.length - 1 && (
                      <div className="business-step-arrow">
                        <svg width="20" height="40" viewBox="0 0 20 40">
                          <path d="M10,0 L10,40 M5,30 L10,40 L15,30" fill="none" stroke="#666" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="direct-business-flow">
                <div className="business-system source">
                  <div className="business-system-name" style={{ backgroundColor: getSystemColor(selectedFlow.source_system) }}>
                    {selectedFlow.source_system}
                  </div>
                  <div className="business-system-role">
                    {selectedFlow.source_system.includes('MIRA') || selectedFlow.source_system.includes('MISA') ? 'Data Provider' : 
                     selectedFlow.source_system.includes('GAS-X') ? 'Network System' :
                     selectedFlow.source_system.includes('VHP') ? 'Trading Platform' :
                     'Market Participant'}
                  </div>
                </div>
                
                <div className="business-flow-arrow">
                  <div className="business-flow-label" style={{ color: getFormatColor(selectedFlow.format) }}>
                    <strong>{selectedFlow.format}</strong><br/>
                    {selectedFlow.transmission_method}
                  </div>
                  <svg width="100" height="20" viewBox="0 0 100 20">
                    <defs>
                      <marker id="businessArrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                      </marker>
                    </defs>
                    <path d="M0,10 H90" fill="none" stroke="#666" strokeWidth="2" markerEnd="url(#businessArrow)" />
                  </svg>
                </div>
                
                <div className="business-system target">
                  <div className="business-system-name" style={{ backgroundColor: getSystemColor(selectedFlow.target_system) }}>
                    {selectedFlow.target_system}
                  </div>
                  <div className="business-system-role">
                    {selectedFlow.target_system.includes('MIRA') || selectedFlow.target_system.includes('MISA') ? 'Data Consumer' : 
                     selectedFlow.target_system.includes('GAS-X') ? 'Network System' :
                     selectedFlow.target_system.includes('VHP') ? 'Trading Platform' :
                     'Market Participant'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Render flow detail for technical mode (technical details)
  const renderFlowTechnical = () => {
    if (!selectedFlow) return <p>No data flow selected</p>;
    
    return (
      <>
        {renderBreadcrumbs()}
        
        {/* Technical status bar with health indicators */}
        <div className="technical-status-bar">
          <div className="technical-status-left">
            <span className="format-badge" style={{ 
              backgroundColor: getFormatColor(selectedFlow.format),
              marginBottom: 0
            }}>
              {selectedFlow.format}
            </span>
            
            <span className={`technical-status-badge ${technicalDetails?.status === 'error' ? 'status-error' : 'status-ok'}`}>
              {technicalDetails?.status === 'error' ? 'Error' : 'Operational'}
            </span>
            
            <span className="tech-id-badge">
              ID: {selectedFlow.id}
            </span>
          </div>
          <div className="technical-metrics">
            <div className="technical-metric">
              <span className="metric-label">Latency:</span>
              <span className="metric-value">{technicalDetails?.latency || '?'} ms</span>
            </div>
            <div className="technical-metric">
              <span className="metric-label">Throughput:</span>
              <span className="metric-value">{technicalDetails?.throughput || '?'}/day</span>
            </div>
          </div>
        </div>
        
        {/* Technical specification section */}
        <div className="technical-specification">
          <h4>Technical Specification</h4>
          <div className="technical-spec-content">
            <div className="technical-spec-row">
              <div className="technical-spec-label">Format:</div>
              <div className="technical-spec-value">
                <span className="tech-format-badge" style={{ backgroundColor: getFormatColor(selectedFlow.format) }}>
                  {selectedFlow.format}
                </span>
                <span className="format-version">EDIG@S Version 5.1</span>
              </div>
            </div>
            <div className="technical-spec-row">
              <div className="technical-spec-label">Transmission:</div>
              <div className="technical-spec-value">{selectedFlow.transmission_method || 'AS4'}</div>
            </div>
            <div className="technical-spec-row">
              <div className="technical-spec-label">Protocol:</div>
              <div className="technical-spec-value">HTTPS</div>
            </div>
            <div className="technical-spec-row">
              <div className="technical-spec-label">Authentication:</div>
              <div className="technical-spec-value">TLS-MA</div>
            </div>
            <div className="technical-spec-row">
              <div className="technical-spec-label">Encoding:</div>
              <div className="technical-spec-value">UTF-8</div>
            </div>
            <div className="technical-spec-row">
              <div className="technical-spec-label">Content Type:</div>
              <div className="technical-spec-value">application/xml</div>
            </div>
          </div>
        </div>
        
        {/* Technical endpoints */}
        <div className="technical-endpoints">
          <h4>Endpoints</h4>
          <div className="technical-endpoints-content">
            <div className="endpoint-section">
              <div className="endpoint-type">Test Environment</div>
              <code className="endpoint-url">/api/test/{selectedFlow.format.toLowerCase()}</code>
            </div>
            <div className="endpoint-section">
              <div className="endpoint-type">Production Environment</div>
              <code className="endpoint-url">/api/{selectedFlow.format.toLowerCase()}</code>
            </div>
          </div>
        </div>
        
        {/* Technical data structure */}
        <div className="technical-data-structure">
          <h4>Data Structure</h4>
          <div className="technical-data-content">
            <div className="data-table">
              <div className="data-table-header">
                <div className="data-table-cell">Field</div>
                <div className="data-table-cell">Type</div>
                <div className="data-table-cell">Required</div>
                <div className="data-table-cell">Validation</div>
              </div>

              {technicalDetails?.dataFields?.length > 0 ? (
                technicalDetails.dataFields.map((field, index) => (
                  <div key={index} className="data-table-row">
                    <div className="data-table-cell">{field.name}</div>
                    <div className="data-table-cell">{field.type}</div>
                    <div className="data-table-cell">{field.required ? 'Yes' : 'No'}</div>
                    <div className="data-table-cell">{field.validation}</div>
                  </div>
                ))
              ) : (
                <>
                  <div className="data-table-row">
                    <div className="data-table-cell">ShipperCode</div>
                    <div className="data-table-cell">String(10)</div>
                    <div className="data-table-cell">Yes</div>
                    <div className="data-table-cell">alphanumeric</div>
                  </div>
                  <div className="data-table-row">
                    <div className="data-table-cell">GasDay</div>
                    <div className="data-table-cell">Date</div>
                    <div className="data-table-cell">Yes</div>
                    <div className="data-table-cell">ISO8601</div>
                  </div>
                  <div className="data-table-row">
                    <div className="data-table-cell">BalanceGroupEIC</div>
                    <div className="data-table-cell">String(16)</div>
                    <div className="data-table-cell">Yes</div>
                    <div className="data-table-cell">EIC code</div>
                  </div>
                  <div className="data-table-row">
                    <div className="data-table-cell">GasQuantity</div>
                    <div className="data-table-cell">Decimal</div>
                    <div className="data-table-cell">Yes</div>
                    <div className="data-table-cell">numeric &gt; 0</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="adaptive-detail-panel" style={{ backgroundColor: colorPalette.lightGray }}>
      <div className="detail-header">
        <h3>
          {(() => {
            if (selectedSystem && !selectedFlow) {
              return `System: ${selectedSystem}`;
            } else if (selectedFlow) {
              return `Data Flow: ${selectedFlow.name || selectedFlow.id}`;
            } else {
              return currentMode === 'overview' ? 'Overview' :
                     currentMode === 'focused' ? 'Business Context' :
                     currentMode === 'technical' ? 'Technical Details' : 'Dashboard';
            }
          })()}
        </h3>
        <button 
          className="export-button" 
          onClick={onExportPDF}
          style={{ backgroundColor: colorPalette.accent2 }}
          disabled={!selectedFlow && !selectedSystem}
        >
          Export PDF
        </button>
      </div>
      
      <div className="detail-content">
        {renderDetailContent()}
      </div>
      
      {/* Mode-specific controls */}
      {currentMode === 'technical' && (selectedFlow || selectedSystem) && (
        <div className="tech-action-panel">
          <button className="tech-action-button">Run Diagnostics</button>
          <button className="tech-action-button">View Logs</button>
          <button className="tech-action-button">Test Connection</button>
        </div>
      )}
    </div>
  );
};

export default AdaptiveDetailPanel;