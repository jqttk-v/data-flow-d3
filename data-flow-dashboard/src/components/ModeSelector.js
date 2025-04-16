// src/components/ModeSelector.js
import React from 'react';
import '../styles/ModeSelector.css';

const ModeSelector = ({ currentMode, onModeChange, colorPalette }) => {
  const modes = [
    { 
      id: 'overview', 
      name: 'Overview', 
      description: 'Complete view of all systems, data flows, and interfaces',
      icon: '🔍'
    },
    { 
      id: 'focused', 
      name: 'Focused', 
      description: 'Filtered view for specific departments or business cases',
      icon: '🎯'
    },
    { 
      id: 'technical', 
      name: 'Technical', 
      description: 'Full-detail technical view with metadata and diagnostics',
      icon: '⚙️'
    }
  ];

  return (
    <div className="mode-selector">
      <div className="mode-selector-container" style={{ background: colorPalette.lightGray }}>
        {modes.map(mode => (
          <button 
            key={mode.id}
            className={`mode-button ${currentMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
            style={{ 
              borderColor: currentMode === mode.id ? colorPalette.primary : '#ddd',
              backgroundColor: currentMode === mode.id ? colorPalette.primary : '#ffffff',
              color: currentMode === mode.id ? 'white' : '#333'
            }}
            title={mode.description}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.name}</span>
          </button>
        ))}
      </div>

      {/* Mode description banner */}
      <div 
        className="mode-description"
        style={{ 
          backgroundColor: colorPalette.accent1,
          borderRadius: '0 0 4px 4px',
          padding: '8px 16px',
          fontSize: '14px',
          color: '#333'
        }}
      >
        <strong>{modes.find(m => m.id === currentMode)?.name} Mode:</strong> {modes.find(m => m.id === currentMode)?.description}
      </div>
    </div>
  );
};

export default ModeSelector;