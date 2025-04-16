// src/components/ViewSelector.js
import React from 'react';
import '../styles/ViewSelector.css';

const ViewSelector = ({ currentView, onViewChange, colorPalette }) => {
  const views = [
    { id: 'cluster', name: 'Cluster', description: 'Gruppierte Ansicht aller Elemente' },
    { id: 'hierarchical', name: 'Hierarchisch', description: 'BPMN-ähnliche Ansicht mit Ebenenstruktur' }
  ];

  return (
    <div className="view-selector">
      <div className="view-options">
        {views.map(view => (
          <button 
            key={view.id}
            className={`view-button ${currentView === view.id ? 'active' : ''}`}
            onClick={() => onViewChange(view.id)}
            style={{ 
              borderColor: currentView === view.id ? colorPalette.primary : '#ddd',
              backgroundColor: currentView === view.id ? colorPalette.primary : '#f0f0f0',
              color: currentView === view.id ? 'white' : '#333'
            }}
          >
            <span className="view-icon">
              {view.id === 'cluster' ? '◉' : '⊥'}
            </span>
            {view.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewSelector;