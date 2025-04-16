import React, { useState } from 'react';
import '../styles/FlowDetails.css'; // Erstellen Sie diese CSS-Datei für das Styling

// Diese Komponente in Ihre Hauptanwendung einbinden
const FlowDetailsPanel = ({ flow, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  
  if (!flow) return null;
  
  return (
    <div className="flow-details-panel">
      <div className="flow-details-header">
        <h3>Datenfluss: {flow.id}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="flow-details-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Allgemein
        </button>
        <button 
          className={`tab-button ${activeTab === 'process' ? 'active' : ''}`}
          onClick={() => setActiveTab('process')}
        >
          Prozessschritte
        </button>
        <button 
          className={`tab-button ${activeTab === 'systems' ? 'active' : ''}`}
          onClick={() => setActiveTab('systems')}
        >
          Systeme
        </button>
      </div>
      
      <div className="flow-details-content">
        {activeTab === 'general' && (
          <div className="tab-content">
            <div className="detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{flow.name}</span>
            </div>
            
            {flow.description && (
              <div className="detail-item">
                <span className="detail-label">Beschreibung:</span>
                <span className="detail-value">{flow.description}</span>
              </div>
            )}
            
            <div className="detail-item">
              <span className="detail-label">Format:</span>
              <span className="detail-value format-badge">{flow.format || 'Unbekannt'}</span>
            </div>
            
            {flow.transferMethod && (
              <div className="detail-item">
                <span className="detail-label">Übertragungsweg:</span>
                <span className="detail-value">{flow.transferMethod}</span>
              </div>
            )}
            
            {flow.trigger && (
              <div className="detail-item">
                <span className="detail-label">Auslöser:</span>
                <span className="detail-value">{flow.trigger}</span>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'process' && (
          <div className="tab-content">
            {flow.processSteps && flow.processSteps.length > 0 ? (
              <div className="process-steps">
                <div className="process-timeline">
                  {flow.processSteps.map((step, index) => (
                    <div key={index} className="process-step">
                      <div className={`step-icon ${step.schritttyp}`}>
                        {index + 1}
                      </div>
                      <div className="step-connector">
                        {index < flow.processSteps.length - 1 && <div className="connector-line"></div>}
                      </div>
                      <div className="step-details">
                        <div className="step-type">{step.schritttyp}</div>
                        <div className="step-interface">{step.interface}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-data-message">
                Keine Prozessschritte für diesen Datenfluss definiert.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'systems' && (
          <div className="tab-content">
            <div className="system-flow">
              <div className="system-item source">
                <div className="system-icon">Q</div>
                <div className="system-details">
                  <div className="system-name">{flow.sourceSystem}</div>
                  <div className="system-role">Quellsystem</div>
                </div>
              </div>
              
              <div className="flow-arrow">
                <svg width="100%" height="20" viewBox="0 0 100 20">
                  <line x1="0" y1="10" x2="95" y2="10" stroke="#96BEBE" strokeWidth="2"/>
                  <polygon points="95,10 85,5 85,15" fill="#96BEBE"/>
                </svg>
                <div className="flow-format">{flow.format || 'Datenfluss'}</div>
              </div>
              
              <div className="system-item target">
                <div className="system-icon">Z</div>
                <div className="system-details">
                  <div className="system-name">{flow.targetSystem}</div>
                  <div className="system-role">Zielsystem</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flow-details-footer">
        <div className="flow-id">ID: {flow.id}</div>
      </div>
    </div>
  );
};

export default FlowDetailsPanel;