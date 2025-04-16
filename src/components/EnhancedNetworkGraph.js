// src/components/EnhancedNetworkGraph.js
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import '../styles/EnhancedNetworkGraph.css';

const EnhancedNetworkGraph = ({ 
  dataFlows = [], 
  systems = [], 
  interfaces = [], 
  currentMode = 'overview',
  onSelectFlow = () => {}, 
  onSelectSystem = () => {},
  selectedFlow = null,
  selectedSystem = null,
  colorPalette = {}
}) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const simulationRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState([]);

  // Determine node group (for coloring) based on system name
  const getSystemGroup = useCallback((systemName) => {
    if (!systemName) return 0;
    
    if (systemName.includes('MIRA') || systemName.includes('MISA')) return 1;
    if (systemName.includes('Marktpartner')) return 2;
    if (systemName.includes('GAS-X-GRID')) return 3;
    if (systemName.includes('GAS-X-BKN') || systemName.includes('GAS-X-BEN')) return 4;
    if (systemName.includes('VHP')) return 5;
    return 0; // Default group
  }, []);
  
  // Determine group for formats
  const getFormatGroup = useCallback((format) => {
    if (!format) return 7;
    
    switch (format) {
      case 'NOMINT': return 8;
      case 'CONTRL': return 9;
      case 'APERAK': return 10;
      case 'ACKNOW': return 11;
      case 'NOMRES': return 12;
      case 'ALOCAT': return 13;
      case 'INVOIC': return 14;
      default: return 7;
    }
  }, []);

  // Get system color based on system name
  const getSystemColor = useCallback((systemName) => {
    if (!systemName) return '#999999';
    
    const defaultColors = {
      primary: '#C63441',     // MIRA/MISA - Red
      secondary: '#96BEBE',   // GAS-X-GRID - Teal
      tertiary: '#C0BCAC',    // Marktpartner - Gray
      accent1: '#E1BA50',     // GAS-X-BKN - Gold
      accent2: '#677488',     // VHP - Slate Blue
    };
    
    if (systemName.includes('MIRA') || systemName.includes('MISA')) 
      return colorPalette.primary || defaultColors.primary;
    if (systemName.includes('Marktpartner')) 
      return colorPalette.tertiary || defaultColors.tertiary;
    if (systemName.includes('GAS-X-GRID')) 
      return colorPalette.secondary || defaultColors.secondary;
    if (systemName.includes('GAS-X-BKN') || systemName.includes('GAS-X-BEN')) 
      return colorPalette.accent1 || defaultColors.accent1;
    if (systemName.includes('VHP')) 
      return colorPalette.accent2 || defaultColors.accent2;
    
    return '#999999';
  }, [colorPalette]);

  // Node size based on type and importance
  const getNodeRadius = useCallback((node) => {
    if (currentMode === 'technical') {
      if (node.type === 'system') return 45;
      if (node.type === 'interface') return 35;
      if (node.type === 'dataflow') return node.technical?.hasError ? 30 : 25;
      return 25;
    } else {
      if (node.type === 'system') return 40;
      if (node.type === 'interface') return 30;
      if (node.type === 'dataflow') return 25;
      return 25;
    }
  }, [currentMode]);
  
  // Assign color based on node type/format
  const getNodeColor = useCallback((node) => {
    if (node.type === 'interface') {
      return '#96BEBE'; // Interface color
    }
    
    if (node.type === 'dataflow') {
      // Colors for different formats
      switch (node.format) {
        case 'NOMINT': return '#C63441'; // Red
        case 'CONTRL': return '#677488'; // Slate Blue
        case 'APERAK': return '#96BEBE'; // Light Teal
        case 'ACKNOW': return '#E1BA50'; // Gold
        case 'NOMRES': return '#C0BCAC'; // Warm Gray
        case 'ALOCAT': return '#E18B50'; // Orange (variant)
        case 'INVOIC': return '#E1BA50'; // Gold
        default: return '#AAAAAA'; // Gray for unknown formats
      }
    }
    
    // System coloring
    const defaultColors = {
      primary: '#C63441',     // MIRA/MISA - Red
      secondary: '#96BEBE',   // GAS-X-GRID - Teal
      tertiary: '#C0BCAC',    // Marktpartner - Gray
      accent1: '#E1BA50',     // GAS-X-BKN - Gold
      accent2: '#677488',     // VHP - Slate Blue
    };
    
    switch (node.group) {
      case 1: return colorPalette.primary || defaultColors.primary;
      case 2: return colorPalette.tertiary || defaultColors.tertiary;
      case 3: return colorPalette.secondary || defaultColors.secondary;
      case 4: return colorPalette.accent1 || defaultColors.accent1;
      case 5: return colorPalette.accent2 || defaultColors.accent2;
      default: return '#999999';
    }
  }, [colorPalette]);
  
  // Get link color based on format or type
  const getLinkColor = useCallback((link) => {
    // Use format color for links with flow format
    if (link.flow && link.flow.format) {
      switch (link.flow.format) {
        case 'NOMINT': return '#C63441'; // Red
        case 'CONTRL': return '#677488'; // Slate Blue
        case 'APERAK': return '#96BEBE'; // Light Teal
        case 'ACKNOW': return '#E1BA50'; // Gold
        case 'NOMRES': return '#C0BCAC'; // Warm Gray
        case 'ALOCAT': return '#E18B50'; // Orange (variant)
        case 'INVOIC': return '#E1BA50'; // Gold
        default: return '#CCCCCC';
      }
    }
    
    // Process step links
    if (link.stepType) {
      if (link.stepType.includes('reception')) return '#4CAF50'; // Green
      if (link.stepType.includes('delivery')) return '#FF5722';  // Orange
      if (link.stepType === 'reception-to-delivery') return '#9C27B0'; // Purple
      return '#777777'; // Default gray
    }
    
    // System connection links
    if (link.type === 'system-to-interface') return '#4682B4'; // Steel Blue
    if (link.type === 'interface-to-dataflow') return '#2E8B57'; // Sea Green
    if (link.type === 'system-to-system') return '#999999'; // Gray
    
    // Default color
    return '#CCCCCC';
  }, []);
  
  // Get link style (dashed, dotted, etc)
  const getLinkStyle = useCallback((link) => {
    if (link.dashed) return '5,5'; // Long dashed
    if (link.type === 'dataflow-to-interface') return '3,3'; // Dashed
    if (link.type === 'interface-to-interface') return '1,1'; // Dotted
    if (link.stepType === 'reception-to-delivery') return '5,2'; // Long dash
    if (link.type === 'system-to-system') return '3,3'; // Dashed
    return null; // Solid line
  }, []);

  // Extract all unique interfaces from dataFlows
  const extractAllInterfaces = useCallback(() => {
    const uniqueInterfaces = new Set();
    
    dataFlows.forEach(flow => {
      if (flow.process_steps) {
        flow.process_steps.forEach(step => {
          if (step.interface) {
            uniqueInterfaces.add(step.interface);
          }
        });
      }
    });
    
    return Array.from(uniqueInterfaces);
  }, [dataFlows]);

  // Convert data to graph structure based on current mode
  useEffect(() => {
    if (!dataFlows || dataFlows.length === 0) {
      setGraphData({ nodes: [], links: [] });
      return;
    }
    
    let nodes = [];
    let links = [];
    
    // Extract interfaces from process steps
    const allInterfacesFromSteps = extractAllInterfaces();
    
    // Different data structure based on mode
    if (currentMode === 'overview' || currentMode === 'focused') {
      // Hierarchical structure for overview and focused modes
      
      // Systems (Level 1)
      const systemNodes = systems.map(system => ({
        id: system,
        type: 'system',
        group: getSystemGroup(system),
        level: 1
      }));
      
      // Interfaces (Level 2)
      const interfaceNodes = allInterfacesFromSteps.map(interf => {
        // Find associated systems for this interface
        const systemsForInterface = new Set();
        dataFlows.forEach(flow => {
          if (flow.process_steps) {
            flow.process_steps.forEach(step => {
              if (step.interface === interf) {
                if (step.step_type === 'reception') {
                  systemsForInterface.add(flow.target_system);
                } else if (step.step_type === 'delivery') {
                  systemsForInterface.add(flow.source_system);
                }
              }
            });
          }
        });
        
        return {
          id: interf,
          type: 'interface',
          group: 6,
          level: 2,
          connectedSystems: Array.from(systemsForInterface)
        };
      });
      
      // Data Flows (Level 3)
      const dataFlowNodes = dataFlows.map(flow => ({
        id: `flow-${flow.id}`,
        displayId: flow.id,
        type: 'dataflow',
        name: flow.name,
        format: flow.format,
        flow: flow,
        source_system: flow.source_system,
        target_system: flow.target_system,
        group: getFormatGroup(flow.format),
        level: 3,
        // Store associated interfaces
        interfaces: flow.process_steps ? 
          flow.process_steps.map(step => step.interface).filter(Boolean) : []
      }));
      
      // Combine all nodes
      nodes = [...systemNodes, ...interfaceNodes, ...dataFlowNodes];
      
      // Create links between levels
      
      // Links between Systems and Interfaces
      interfaceNodes.forEach(interfaceNode => {
        interfaceNode.connectedSystems.forEach(systemId => {
          links.push({
            source: systemId,
            target: interfaceNode.id,
            type: 'system-to-interface',
            value: 1.2,
            hierarchyLink: true
          });
        });
      });
      
      // Links between Interfaces and Data Flows
      dataFlowNodes.forEach(flowNode => {
        flowNode.interfaces.forEach(interfaceId => {
          links.push({
            source: interfaceId,
            target: flowNode.id,
            type: 'interface-to-dataflow',
            value: 1.0,
            hierarchyLink: true,
            format: flowNode.format
          });
        });
        
        // Direct connection between source and target system (thin lines)
        links.push({
          source: flowNode.flow.source_system,
          target: flowNode.flow.target_system,
          type: 'system-to-system',
          value: 0.5, // Thinner line
          dashed: true, // Dashed line
          flow: flowNode.flow,
          flowId: flowNode.id // Reference to the flow node for path highlighting
        });
      });
      
      // In focused mode, filter based on selected system
      if (currentMode === 'focused' && selectedSystem) {
        // Keep only nodes and links connected to the selected system
        const relevantFlowIds = new Set();
        dataFlows.forEach(flow => {
          if (flow.source_system === selectedSystem || flow.target_system === selectedSystem) {
            relevantFlowIds.add(`flow-${flow.id}`);
          }
        });
        
        // Keep relevant interface nodes
        const relevantInterfaceIds = new Set();
        links.forEach(link => {
          if (link.type === 'interface-to-dataflow' && relevantFlowIds.has(link.target)) {
            relevantInterfaceIds.add(link.source);
          }
        });
        
        // Filter nodes
        nodes = nodes.filter(node => {
          if (node.type === 'system') {
            return node.id === selectedSystem || 
                   dataFlows.some(f => (f.source_system === node.id || f.target_system === node.id) && 
                                      (f.source_system === selectedSystem || f.target_system === selectedSystem));
          } else if (node.type === 'interface') {
            return relevantInterfaceIds.has(node.id);
          } else if (node.type === 'dataflow') {
            return relevantFlowIds.has(node.id);
          }
          return false;
        });
        
        // Filter links
        links = links.filter(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          // Keep system-to-system links involving the selected system
          if (link.type === 'system-to-system') {
            return sourceId === selectedSystem || targetId === selectedSystem;
          }
          
          // For other links, check if both source and target nodes exist
          return nodes.some(n => n.id === sourceId) && nodes.some(n => n.id === targetId);
        });
      }
    } else if (currentMode === 'technical') {
      // Technical mode - more detailed with metadata
      
      // Systems as nodes
      const systemNodes = systems.map(system => ({
        id: system,
        type: 'system',
        group: getSystemGroup(system)
      }));
      
      // Interfaces as nodes (with enhanced metadata)
      const interfaceNodes = allInterfacesFromSteps.map(interf => {
        // Find flows using this interface
        const relevantFlows = dataFlows.filter(flow => 
          flow.process_steps && flow.process_steps.some(step => step.interface === interf)
        );
        
        const stepTypes = new Set();
        relevantFlows.forEach(flow => {
          flow.process_steps.forEach(step => {
            if (step.interface === interf) {
              stepTypes.add(step.step_type);
            }
          });
        });
        
        return {
          id: interf,
          type: 'interface',
          group: 6,
          relevantFlowIds: relevantFlows.map(f => f.id),
          stepTypes: Array.from(stepTypes)
        };
      });
      
      // Data flows with technical metadata
      const dataflowNodes = dataFlows.map(flow => {
        const technicalInfo = {
          steps: flow.process_steps ? flow.process_steps.length : 0,
          hasError: Math.random() > 0.8, // Simulate error state 
          latency: Math.floor(Math.random() * 200) + 50,
          lastUpdated: new Date().toISOString()
        };
        
        return {
          id: `flow-${flow.id}`,
          displayId: flow.id,
          type: 'dataflow',
          name: flow.name,
          format: flow.format,
          flow: flow,
          source_system: flow.source_system,
          target_system: flow.target_system,
          group: getFormatGroup(flow.format),
          technical: technicalInfo
        };
      });
      
      // Combine all nodes
      nodes = [...systemNodes, ...interfaceNodes, ...dataflowNodes];
      
      // Create detailed links with technical metadata
      dataFlows.forEach(flow => {
        // Source system to data flow link
        links.push({
          source: flow.source_system,
          target: `flow-${flow.id}`,
          type: 'system-to-dataflow',
          value: 1,
          id: `source-${flow.id}`,
          flow: flow,
          flowId: `flow-${flow.id}`,
          technical: {
            protocol: 'AS4',
            encryptionType: 'TLS 1.2',
            status: Math.random() > 0.9 ? 'degraded' : 'operational'
          }
        });
        
        // Process steps with detailed information
        if (flow.process_steps && flow.process_steps.length > 0) {
          // Connection from flow to each interface
          flow.process_steps.forEach((step, index) => {
            if (step.interface) {
              links.push({
                source: `flow-${flow.id}`,
                target: step.interface,
                type: 'dataflow-to-interface',
                value: 0.7,
                stepType: step.step_type,
                stepIndex: index,
                flow: flow,
                flowId: `flow-${flow.id}`,
                technical: {
                  stepName: step.step_type,
                  processingTime: Math.floor(Math.random() * 100) + 10,
                  validations: Math.floor(Math.random() * 5) + 1
                }
              });
            }
          });
          
          // Connect process steps in sequence
          for (let i = 0; i < flow.process_steps.length - 1; i++) {
            const currentStep = flow.process_steps[i];
            const nextStep = flow.process_steps[i + 1];
            
            if (currentStep.interface && nextStep.interface) {
              links.push({
                source: currentStep.interface,
                target: nextStep.interface,
                type: 'interface-to-interface',
                value: 0.5,
                stepType: `${currentStep.step_type}-to-${nextStep.step_type}`,
                flow: flow,
                flowId: `flow-${flow.id}`,
                technical: {
                  transition: `${currentStep.step_type} to ${nextStep.step_type}`,
                  handoff: currentStep.step_type === 'delivery' && nextStep.step_type === 'reception',
                  delayMs: Math.floor(Math.random() * 50) + 5
                }
              });
            }
          }
          
          // Connect last interface to target system
          const lastStep = flow.process_steps[flow.process_steps.length - 1];
          if (lastStep && lastStep.interface) {
            links.push({
              source: lastStep.interface,
              target: flow.target_system,
              type: 'interface-to-system',
              value: 0.7,
              stepType: 'final-delivery',
              flow: flow,
              flowId: `flow-${flow.id}`,
              technical: {
                finalStep: true,
                confirmation: true,
                completionCode: 'SUCCESS'
              }
            });
          }
        } else {
          // Direct connection if no process steps
          links.push({
            source: `flow-${flow.id}`,
            target: flow.target_system,
            type: 'dataflow-to-system',
            value: 1,
            id: `target-${flow.id}`,
            flow: flow,
            flowId: `flow-${flow.id}`,
            technical: {
              direct: true,
              bypassReason: 'No processing required'
            }
          });
        }
      });
    }
    
    // Remove duplicate nodes and links
    const uniqueNodes = Array.from(
      new Map(nodes.map(node => [node.id, node])).values()
    );
    
    const uniqueLinksMap = new Map();
    links.forEach(link => {
      const linkKey = `${link.source}-${link.target}-${link.type}`;
      if (!uniqueLinksMap.has(linkKey)) {
        uniqueLinksMap.set(linkKey, link);
      }
    });
    
    const uniqueLinks = Array.from(uniqueLinksMap.values());
    
    setGraphData({ nodes: uniqueNodes, links: uniqueLinks });
  }, [dataFlows, systems, currentMode, selectedSystem, extractAllInterfaces, getSystemGroup, getFormatGroup]);
  
  // Generate tooltip content based on node type
  const getTooltipContent = useCallback((d) => {
    if (currentMode === 'technical') {
      // Detailed tooltips for technical mode
      if (d.type === 'system') {
        return `
          <div class="tooltip-technical">
            <div class="tooltip-header">${d.id}</div>
            <div class="tooltip-section">
              <div class="tooltip-label">Type:</div>
              <div class="tooltip-value">System</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Status:</div>
              <div class="tooltip-value status-ok">Operational</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Connected Flows:</div>
              <div class="tooltip-value">${dataFlows.filter(f => f.source_system === d.id || f.target_system === d.id).length}</div>
            </div>
            <div class="tooltip-footer">Click for system details</div>
          </div>
        `;
      } else if (d.type === 'interface') {
        // Find flows that use this interface
        const relevantFlows = dataFlows.filter(flow => 
          flow.process_steps && flow.process_steps.some(step => step.interface === d.id)
        );
        
        const stepTypes = new Set();
        relevantFlows.forEach(flow => {
          flow.process_steps.forEach(step => {
            if (step.interface === d.id) {
              stepTypes.add(step.step_type);
            }
          });
        });
        
        return `
          <div class="tooltip-technical">
            <div class="tooltip-header">${d.id}</div>
            <div class="tooltip-section">
              <div class="tooltip-label">Type:</div>
              <div class="tooltip-value">Interface</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Step Types:</div>
              <div class="tooltip-value">${Array.from(stepTypes).join(', ') || 'None'}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Used In:</div>
              <div class="tooltip-value">${relevantFlows.length} data flows</div>
            </div>
            <div class="tooltip-footer">Click for interface details</div>
          </div>
        `;
      } else if (d.type === 'dataflow') {
        // Technical data flow details
        const technical = d.technical || {};
        
        return `
          <div class="tooltip-technical">
            <div class="tooltip-header">${d.displayId} (${d.format || 'Unknown'})</div>
            <div class="tooltip-section">
              <div class="tooltip-label">Name:</div>
              <div class="tooltip-value">${d.name || d.flow?.name || 'Unnamed Flow'}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Format:</div>
              <div class="tooltip-value">${d.format || 'Unknown'}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Route:</div>
              <div class="tooltip-value">${d.flow?.source_system || '?'} → ${d.flow?.target_system || '?'}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Steps:</div>
              <div class="tooltip-value">${technical.steps || 'Direct'}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">Status:</div>
              <div class="tooltip-value ${technical.hasError ? 'status-error' : 'status-ok'}">${technical.hasError ? 'Error' : 'OK'}</div>
            </div>
            <div class="tooltip-footer">Click for flow details</div>
          </div>
        `;
      }
    } else {
      // Simpler tooltips for overview and focused modes
      if (d.type === 'system') {
        return `
          <div class="tooltip-standard">
            <strong>System: ${d.id}</strong><br/>
            <span class="tooltip-subtitle">Connected with ${dataFlows.filter(f => f.source_system === d.id || f.target_system === d.id).length} flows</span><br/>
            <span class="tooltip-hint">Click for system details</span>
          </div>
        `;
      } else if (d.type === 'interface') {
        const relevantFlows = dataFlows.filter(flow => 
          flow.process_steps && flow.process_steps.some(step => step.interface === d.id)
        );
        
        return `
          <div class="tooltip-standard">
            <strong>Interface: ${d.id}</strong><br/>
            <span class="tooltip-subtitle">Used in ${relevantFlows.length} data flows</span><br/>
            <span class="tooltip-hint">Click for details</span>
          </div>
        `;
      } else if (d.type === 'dataflow') {
        return `
          <div class="tooltip-standard">
            <strong>Data Flow: ${d.displayId}</strong><br/>
            <span class="tooltip-subtitle">${d.name || d.flow?.name || ''}</span><br/>
            <span class="tooltip-subtitle">Format: ${d.format || 'Unknown'}</span><br/>
            <span class="tooltip-subtitle">${d.flow?.source_system || '?'} → ${d.flow?.target_system || '?'}</span><br/>
            <span class="tooltip-hint">Click for flow details</span>
          </div>
        `;
      }
    }
    
    return '';
  }, [dataFlows, currentMode]);
  
  // Generate link tooltip content
  const getLinkTooltipContent = useCallback((d) => {
    if (currentMode === 'technical') {
      const technical = d.technical || {};
      
      return `
        <div class="tooltip-technical">
          <div class="tooltip-header">Connection</div>
          <div class="tooltip-section">
            <div class="tooltip-label">Type:</div>
            <div class="tooltip-value">${d.type.replace(/-/g, ' to ')}</div>
          </div>
          ${d.flow ? `
          <div class="tooltip-section">
            <div class="tooltip-label">Flow:</div>
            <div class="tooltip-value">${d.flow.name || d.flow.id || 'Unknown'}</div>
          </div>
          ` : ''}
          ${d.stepType ? `
          <div class="tooltip-section">
            <div class="tooltip-label">Step:</div>
            <div class="tooltip-value">${d.stepType}</div>
          </div>
          ` : ''}
          ${technical.status ? `
          <div class="tooltip-section">
            <div class="tooltip-label">Status:</div>
            <div class="tooltip-value status-${technical.status === 'operational' ? 'ok' : 'warning'}">${technical.status}</div>
          </div>
          ` : ''}
        </div>
      `;
    } else {
      // Simpler tooltips for overview and focused modes
      let content = '<div class="tooltip-standard">';
      
      if (d.type.includes('dataflow')) {
        content += `<strong>Data Flow Connection</strong><br/>`;
        if (d.flow) {
          content += `<span class="tooltip-subtitle">${d.flow.name || d.flow.id || 'Unknown'}</span><br/>`;
          if (d.flow.format) {
            content += `<span class="tooltip-subtitle">Format: ${d.flow.format}</span><br/>`;
          }
        }
      } else if (d.stepType) {
        content += `<strong>Process Step: ${d.stepType}</strong><br/>`;
      } else {
        content += `<strong>Connection</strong><br/>`;
      }
      
      if (d.source && d.target) {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        
        content += `<span class="tooltip-subtitle">From: ${sourceId}</span><br/>`;
        content += `<span class="tooltip-subtitle">To: ${targetId}</span><br/>`;
      }
      
      content += '</div>';
      return content;
    }
  }, [currentMode]);

  // Find and highlight the complete path for a flow (defined before it's used in highlightConnections)
  const highlightFlowPath = useCallback((flowId) => {
    if (!flowId) {
      setHighlightedPath([]);
      return;
    }
    
    // Find all links related to this flow
    const relatedLinks = graphData.links.filter(link => link.flowId === flowId);
    
    // Start with source system of the flow
    const flowNode = graphData.nodes.find(node => node.id === flowId);
    if (!flowNode) {
      setHighlightedPath([]);
      return;
    }
    
    // Get source and target systems
    const sourceSystem = flowNode.source_system;
    const targetSystem = flowNode.target_system;
    
    // Use breadth-first search to find all paths between source and target
    const pathLinks = [];
    const queue = [...relatedLinks];
    
    while (queue.length > 0) {
      const link = queue.shift();
      if (!link) continue;
      
      // If this link is already in our path, skip it
      if (pathLinks.some(l => l.source === link.source && l.target === link.target)) {
        continue;
      }
      
      // Add this link to our path
      pathLinks.push(link);
    }
    
    setHighlightedPath(pathLinks);
  }, [graphData]);

  // Reset all highlighting
  const resetHighlighting = useCallback(() => {
    if (!svgRef.current) return;

    // Clear highlighted path
    setHighlightedPath([]);

    // Reset all links
    d3.select(svgRef.current)
      .selectAll('.link')
      .classed('highlighted', false)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.value || 1);
    
    // Reset all nodes
    d3.select(svgRef.current)
      .selectAll('.node-group')
      .classed('selected-node', false)
      .classed('connected-node', false)
      .style('opacity', 1)
      .each(function(d) {
        const node = d3.select(this);
        
        // Reset styles based on node type
        if (d.type === 'system') {
          node.select('rect.system-node')
            .attr('stroke', '#333333')
            .attr('stroke-width', 2);
          
          node.select('rect.system-header')
            .attr('fill', getSystemColor(d.id));
        } else if (d.type === 'interface') {
          node.select('polygon.interface-node')
            .attr('stroke', '#333333')
            .attr('stroke-width', 2);
        } else if (d.type === 'dataflow') {
          node.select('rect.dataflow-node')
            .attr('stroke', '#555555')
            .attr('stroke-width', 1.5);
        }
      });
    
    // Reset all labels
    d3.select(svgRef.current)
      .selectAll('.node-label')
      .style('font-weight', 'normal')
      .style('opacity', 1);
  }, [getSystemColor]);

  // Highlight connected nodes and links (defined after resetHighlighting)
  const highlightConnections = useCallback((nodeId) => {
    if (!svgRef.current) return;

    // Reset all previous highlighting
    resetHighlighting();

    // Find the node
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // If this is a data flow, highlight its complete path
    if (node.type === 'dataflow') {
      highlightFlowPath(nodeId);
    }

    // Use D3 selections to highlight connected links
    d3.select(svgRef.current)
      .selectAll('.link')
      .classed('highlighted', false)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.value || 1)
      .filter(d => {
        const source = typeof d.source === 'object' ? d.source.id : d.source;
        const target = typeof d.target === 'object' ? d.target.id : d.target;
        return source === nodeId || target === nodeId || 
               (node.type === 'dataflow' && d.flowId === nodeId);
      })
      .classed('highlighted', true)
      .attr('stroke-opacity', 1)
      .attr('stroke-width', d => (d.value || 1) * 2);
    
    // Find connected node IDs
    const connectedNodeIds = new Set();
    d3.select(svgRef.current).selectAll('.link').each(function(d) {
      if (!d) return;
      
      const source = typeof d.source === 'object' ? d.source.id : d.source;
      const target = typeof d.target === 'object' ? d.target.id : d.target;
      
      if (source === nodeId) {
        connectedNodeIds.add(target);
      } else if (target === nodeId) {
        connectedNodeIds.add(source);
      } else if (node.type === 'dataflow' && d.flowId === nodeId) {
        // For data flows, also highlight all nodes in the path
        connectedNodeIds.add(source);
        connectedNodeIds.add(target);
      }
    });
    
    // Highlight nodes
    d3.select(svgRef.current)
      .selectAll('.node-group')
      .each(function(d) {
        if (!d) return;
        
        const node = d3.select(this);
        
        if (d.id === nodeId) {
          // Selected node
          node.classed('selected-node', true).style('opacity', 1);
          
          // Different highlighting based on node type
          if (d.type === 'system') {
            node.select('rect.system-node')
              .attr('stroke', colorPalette.primary || '#C63441')
              .attr('stroke-width', 3);
            
            node.select('rect.system-header')
              .attr('fill', d3.color(getSystemColor(d.id)).darker(0.5));
          } else if (d.type === 'interface') {
            node.select('polygon.interface-node')
              .attr('stroke', colorPalette.primary || '#C63441')
              .attr('stroke-width', 3);
          } else if (d.type === 'dataflow') {
            node.select('rect.dataflow-node')
              .attr('stroke', colorPalette.primary || '#C63441')
              .attr('stroke-width', 3);
          }
        } else if (connectedNodeIds.has(d.id)) {
          // Connected nodes
          node.classed('connected-node', true).style('opacity', 1);
          
          if (d.type === 'system') {
            node.select('rect.system-node')
              .attr('stroke', colorPalette.accent1 || '#E1BA50')
              .attr('stroke-width', 2);
            
            node.select('rect.system-header')
              .attr('fill', d3.color(getSystemColor(d.id)).darker(0.2));
          } else if (d.type === 'interface') {
            node.select('polygon.interface-node')
              .attr('stroke', colorPalette.accent1 || '#E1BA50')
              .attr('stroke-width', 2);
          } else if (d.type === 'dataflow') {
            node.select('rect.dataflow-node')
              .attr('stroke', colorPalette.accent1 || '#E1BA50')
              .attr('stroke-width', 2);
          }
        } else {
          // Dim non-connected nodes
          node.classed('selected-node', false)
            .classed('connected-node', false)
            .style('opacity', 0.3);
          
          // Reset styles
          if (d.type === 'system') {
            node.select('rect.system-node')
              .attr('stroke', '#333333')
              .attr('stroke-width', 2);
            
            node.select('rect.system-header')
              .attr('fill', getSystemColor(d.id));
          } else if (d.type === 'interface') {
            node.select('polygon.interface-node')
              .attr('stroke', '#333333')
              .attr('stroke-width', 2);
          } else if (d.type === 'dataflow') {
            node.select('rect.dataflow-node')
              .attr('stroke', '#555555')
              .attr('stroke-width', 1.5);
          }
        }
      });

    // Highlight/dim node labels
    d3.select(svgRef.current)
      .selectAll('.node-label')
      .each(function(d) {
        if (!d) return;
        
        const label = d3.select(this);
        
        if (d.id === nodeId || connectedNodeIds.has(d.id)) {
          label.style('font-weight', 'bold')
               .style('opacity', 1);
        } else {
          label.style('font-weight', 'normal')
               .style('opacity', 0.4);
        }
      });
  }, [graphData, colorPalette, getSystemColor, resetHighlighting, highlightFlowPath]);

  // Node drag event handler
  const handleNodeDrag = useCallback((event) => {
    const nodeData = event.subject;
    if (!nodeData) return;
    
    const nodeId = nodeData.id;
    
    // Highlight connections
    highlightConnections(nodeId);
  }, [highlightConnections]);

  // Handle node click - show details
  const handleNodeClick = useCallback((event, d) => {
    // Different action depending on node type
    if (d.type === 'system') {
      // Toggle selection
      if (d.id === selectedNode) {
        setSelectedNode(null);
        onSelectSystem(null);
        resetHighlighting();
      } else {
        setSelectedNode(d.id);
        onSelectSystem(d.id);
        onSelectFlow(null); // Reset selected flow
        highlightConnections(d.id);
      }
    } 
    else if (d.type === 'interface') {
      // Toggle highlight for interfaces
      if (d.id === selectedNode) {
        setSelectedNode(null);
        resetHighlighting();
      } else {
        setSelectedNode(d.id);
        highlightConnections(d.id);
          
        // Show related flows
        const relevantFlows = dataFlows.filter(flow => 
          flow.process_steps && flow.process_steps.some(step => step.interface === d.id)
        );
        
        if (relevantFlows.length === 1) {
          onSelectFlow(relevantFlows[0]);
        } else {
          onSelectFlow(null);
        }
      }
    }
    else if (d.type === 'dataflow') {
      if (d.id === selectedNode) {
        setSelectedNode(null);
        onSelectFlow(null);
        resetHighlighting();
      } else {
        setSelectedNode(d.id);
        highlightConnections(d.id);
        
        // Show data flow detail view
        if (d.flow) {
          onSelectFlow(d.flow);
        }
      }
    }
  }, [selectedNode, onSelectSystem, onSelectFlow, dataFlows, highlightConnections, resetHighlighting]);
  
  // Synchronize external selection with graph highlighting
  useEffect(() => {
    if (selectedFlow && !selectedNode) {
      const flowNodeId = `flow-${selectedFlow.id}`;
      setSelectedNode(flowNodeId);
      highlightConnections(flowNodeId);
    } else if (selectedSystem && !selectedNode) {
      setSelectedNode(selectedSystem);
      highlightConnections(selectedSystem);
    } else if (!selectedFlow && !selectedSystem && selectedNode) {
      setSelectedNode(null);
      resetHighlighting();
    }
  }, [selectedFlow, selectedSystem, selectedNode, highlightConnections, resetHighlighting]);

  // Create and update the graph visualization
  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Get container dimensions
    const containerWidth = svgRef.current.parentElement.clientWidth;
    const containerHeight = svgRef.current.parentElement.clientHeight || 700;
    
    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', [0, 0, containerWidth, containerHeight]);
    
    // Create marker for arrow heads
    const defs = svg.append('defs');
    
    // Normal arrow
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');
    
    // Highlighted arrow
    defs.append('marker')
      .attr('id', 'arrowhead-highlighted')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#C63441') // Highlighted color
      .style('stroke', 'none');
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.3, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Create a group element for the graph
    const g = svg.append('g');
    
    // Add zoom controls
    const zoomControls = svg.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${containerWidth - 60}, 20)`);
    
    // Zoom in button
    zoomControls.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 30)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#ccc')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
      });
    
    zoomControls.append('text')
      .attr('x', 15)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .text('+')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
      });
    
    // Zoom out button
    zoomControls.append('rect')
      .attr('x', 0)
      .attr('y', 40)
      .attr('width', 30)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#ccc')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
      });
    
    zoomControls.append('text')
      .attr('x', 15)
      .attr('y', 60)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .text('-')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
      });
    
    // Reset zoom button
    zoomControls.append('rect')
      .attr('x', 0)
      .attr('y', 80)
      .attr('width', 30)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#ccc')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
      });
    
    zoomControls.append('text')
      .attr('x', 15)
      .attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('↺')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
      });
    
    // Create a tooltip div
    let tooltip = d3.select('body').select('.tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    }
    tooltipRef.current = tooltip;
    
    // Add mode-specific level indicators for hierarchical view
    if ((currentMode === 'overview' || currentMode === 'focused') && graphData.nodes.some(n => n.level)) {
      const levelLabels = [
        { level: 1, text: 'Systems', y: containerHeight * 0.2 },
        { level: 2, text: 'Interfaces', y: containerHeight * 0.5 },
        { level: 3, text: 'Data Flows', y: containerHeight * 0.8 }
      ];
      
      svg.selectAll('.level-indicator')
        .data(levelLabels)
        .enter()
        .append('text')
        .attr('class', 'level-indicator')
        .attr('x', 20)
        .attr('y', d => d.y)
        .attr('text-anchor', 'start')
        .attr('font-size', '14px')
        .attr('fill', '#64748b')
        .attr('font-weight', '600')
        .text(d => d.text);
    }

    // Create group for links (paths)
    const linkGroup = g.append('g').attr('class', 'links');
    
    // Draw links with curves for better visualization
    const link = linkGroup
      .selectAll('path')
      .data(graphData.links)
      .enter()
      .append('path')
      .attr('class', d => `link ${d.type}`)
      .attr('stroke', d => getLinkColor(d))
      .attr('stroke-width', d => {
        // Thicker lines for data flow links
        if (d.type === 'system-to-system' || d.type.includes('dataflow')) {
          return (d.value || 1) * 2.5;
        }
        return d.value || 1;
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', d => getLinkStyle(d))
      .attr('marker-end', 'url(#arrowhead)')
      .attr('fill', 'none')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('stroke-width', (d.value || 1) * 2.5)
          .attr('stroke-opacity', 1);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        tooltip.html(getLinkTooltipContent(d))
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event, d) => {
        if (!d3.select(event.currentTarget).classed('highlighted')) {
          d3.select(event.currentTarget)
            .attr('stroke-width', d => {
              if (d.type === 'system-to-system' || d.type.includes('dataflow')) {
                return (d.value || 1) * 2;
              }
              return d.value || 1;
            })
            .attr('stroke-opacity', 0.6);
        }
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Add flow animation for specific links
    link.filter(d => d.flow && d.flow.format)
      .classed('animated-flow', true)
      .each(function(d) {
        const linkElement = d3.select(this);
        
        // Add animated circle that moves along the path
        const flowParticle = g.append('circle')
          .attr('class', 'flow-particle')
          .attr('r', 3)
          .attr('fill', getLinkColor(d))
          .attr('filter', 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))');
        
        // Animation function with proper error handling
        function updatePosition() {
          try {
            const path = linkElement.node();
            if (!path) return;
            
            // Check if path is valid and has a length
            let pathLength;
            try {
              pathLength = path.getTotalLength();
              
              // If path length is 0 or NaN, don't continue
              if (!pathLength || isNaN(pathLength)) {
                requestAnimationFrame(updatePosition);
                return;
              }
            } catch (e) {
              // Path is not ready yet, try again in next frame
              requestAnimationFrame(updatePosition);
              return;
            }
            
            // Calculate position along the path
            const now = Date.now();
            const t = (now % 3000) / 3000; // Repeat every 3 seconds
            
            const point = path.getPointAtLength(pathLength * t);
            
            // Update circle position
            flowParticle.attr('cx', point.x).attr('cy', point.y);
          } catch (e) {
            // Silent error - just try again next frame
          }
          
          // Request next frame
          requestAnimationFrame(updatePosition);
        }
        
        // Start animation
        requestAnimationFrame(updatePosition);
      });
    
    // Create node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter().append('g')
      .attr('class', d => `node-group ${d.type}`)
      .attr('level', d => d.level || '')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', (event, d) => {
          dragged(event, d);
          handleNodeDrag(event);
        })
        .on('end', dragended));
    
    // Create node shapes based on type
    node.each(function(d) {
      const nodeGroup = d3.select(this);
      
      if (d.type === 'system') {
        // Rectangular nodes for systems
        nodeGroup.append('rect')
          .attr('class', 'node system-node')
          .attr('width', 180)
          .attr('height', 80)
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('x', -90)
          .attr('y', -40)
          .attr('fill', '#FFFFFF')
          .attr('stroke', '#333333')
          .attr('stroke-width', 2)
          .attr('filter', 'drop-shadow(0px 3px 3px rgba(0,0,0,0.2))')
          .on('click', (event) => handleNodeClick(event, d))
          .on('mouseover', (event) => {
            // Highlight on hover
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('stroke-width', 3);
            
            tooltip.transition()
              .duration(200)
              .style('opacity', .9);
            
            tooltip.html(getTooltipContent(d))
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', (event) => {
            if (!d3.select(event.currentTarget.parentNode).classed('selected-node')) {
              d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr('stroke-width', 2);
            }
            
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
          
        // System header
        nodeGroup.append('rect')
          .attr('class', 'system-header')
          .attr('width', 180)
          .attr('height', 24)
          .attr('rx', 8)
          .attr('ry', 0)
          .attr('x', -90)
          .attr('y', -40)
          .attr('fill', getSystemColor(d.id))
          .attr('stroke', 'none')
          .on('click', (event) => handleNodeClick(event, d));
          
        // System name in header
        nodeGroup.append('text')
          .attr('dy', -24)
          .attr('text-anchor', 'middle')
          .attr('class', 'system-header-text')
          .text(d.id)
          .attr('fill', '#FFFFFF')
          .attr('font-size', 12)
          .attr('font-weight', 'bold');
          
        // System type/description
        nodeGroup.append('text')
          .attr('dy', 0)
          .attr('text-anchor', 'middle')
          .attr('class', 'system-type')
          .text(() => {
            if (d.id.includes('MIRA') || d.id.includes('MISA')) {
              return 'Market Partner System';
            } else if (d.id.includes('GAS-X-GRID')) {
              return 'Network Operation';
            } else if (d.id.includes('GAS-X-BKN') || d.id.includes('GAS-X-BEN')) {
              return 'Balance Group Network';
            } else if (d.id.includes('VHP')) {
              return 'Virtual Hub Portal';
            } else if (d.id.includes('Marktpartner')) {
              return 'External Partner';
            }
            return 'System';
          })
          .attr('fill', '#333333')
          .attr('font-size', 11);
          
        // In technical mode, add status indicator
        if (currentMode === 'technical') {
          nodeGroup.append('circle')
            .attr('cx', 80)
            .attr('cy', -30)
            .attr('r', 6)
            .attr('fill', '#10b981')
            .attr('class', 'status-indicator');
        }
          
      } else if (d.type === 'interface') {
        // Hexagonal shape for interfaces
        const hexRadius = 30;
        const hexPoints = d3.range(6).map(i => {
          const angle = i * Math.PI / 3;
          return [hexRadius * Math.sin(angle), hexRadius * Math.cos(angle)];
        });
        
        nodeGroup.append('polygon')
          .attr('class', 'node interface-node')
          .attr('points', hexPoints.map(p => p.join(',')).join(' '))
          .attr('fill', '#f8fafc')
          .attr('stroke', '#333333')
          .attr('stroke-width', 2)
          .attr('filter', 'drop-shadow(0px 3px 3px rgba(0,0,0,0.2))')
          .on('click', (event) => handleNodeClick(event, d))
          .on('mouseover', (event) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('stroke-width', 3);
            
            tooltip.transition()
              .duration(200)
              .style('opacity', .9);
            
            tooltip.html(getTooltipContent(d))
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', (event) => {
            if (!d3.select(event.currentTarget.parentNode).classed('selected-node')) {
              d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr('stroke-width', 2);
            }
            
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
        
        // API symbol in center
        nodeGroup.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('class', 'interface-icon')
          .text('{ }')
          .attr('fill', '#666666')
          .attr('font-size', 16)
          .attr('font-family', 'monospace');
        
        // In technical mode, add API version
        if (currentMode === 'technical') {
          nodeGroup.append('text')
            .attr('x', 0)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#333')
            .text('v1.2.3');
        }
          
      } else if (d.type === 'dataflow') {
        // Rectangle for dataflows with clear direction
        nodeGroup.append('rect')
          .attr('class', 'node dataflow-node')
          .attr('width', 100)
          .attr('height', 40)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('x', -50)
          .attr('y', -20)
          .attr('fill', getNodeColor(d))
          .attr('stroke', '#555555')
          .attr('stroke-width', 1.5)
          .attr('filter', 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))')
          .on('click', (event) => handleNodeClick(event, d))
          .on('mouseover', (event) => {
            d3.select(event.currentTarget)
              .transition()
              .duration(200)
              .attr('stroke-width', 3);
            
            tooltip.transition()
              .duration(200)
              .style('opacity', .9);
            
            tooltip.html(getTooltipContent(d))
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', (event) => {
            if (!d3.select(event.currentTarget.parentNode).classed('selected-node')) {
              d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr('stroke-width', 1.5);
            }
            
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
        
        // Add directional indicator
        nodeGroup.append('polygon')
          .attr('class', 'direction-indicator')
          .attr('points', '35,-10 55,0 35,10')
          .attr('fill', '#FFFFFF')
          .attr('fill-opacity', 0.7);
        
        // Format badge
        nodeGroup.append('rect')
          .attr('class', 'format-badge')
          .attr('width', 60)
          .attr('height', 20)
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('x', -30)
          .attr('y', -10)
          .attr('fill', '#FFFFFF')
          .attr('fill-opacity', 0.8);
        
        // Format text
        nodeGroup.append('text')
          .attr('dy', 3)
          .attr('text-anchor', 'middle')
          .attr('class', 'format-text')
          .text(d.format || '?')
          .attr('fill', '#333333')
          .attr('font-size', 10)
          .attr('font-weight', 'bold');
        
        // Flow ID
        nodeGroup.append('text')
          .attr('dy', 24)
          .attr('text-anchor', 'middle')
          .attr('class', 'flow-id')
          .text(d.displayId || d.id)
          .attr('fill', '#FFFFFF')
          .attr('font-size', 9);
        
        // In technical mode, add error indicator if needed
        if (currentMode === 'technical' && d.technical) {
          if (d.technical.hasError) {
            nodeGroup.append('circle')
              .attr('cx', 40)
              .attr('cy', -15)
              .attr('r', 8)
              .attr('fill', '#ef4444')
              .attr('class', 'error-indicator');
            
            nodeGroup.append('text')
              .attr('x', 40)
              .attr('y', -11)
              .attr('text-anchor', 'middle')
              .attr('font-size', '12px')
              .attr('fill', 'white')
              .attr('font-weight', 'bold')
              .text('!');
          }
          
          // Add latency indicator
          nodeGroup.append('text')
            .attr('x', 0)
            .attr('y', 12)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#FFFFFF')
            .text(`${d.technical.latency || '?'} ms`);
        }
      }
    });
    
    // Add labels for better clarity
    node.filter(d => d.type === 'interface').append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .text(d => d.id.length > 15 ? d.id.slice(0, 15) + '...' : d.id)
      .attr('fill', '#333')
      .attr('font-size', 10);
    
    // Create the appropriate force simulation based on mode
    let simulation;
    
    if (currentMode === 'overview' || currentMode === 'focused') {
      // Hierarchical layout for overview and focused modes
      simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(d => {
          // Different distances by link type
          if (d.type === 'system-to-interface') return 150;
          if (d.type === 'interface-to-dataflow') return 120;
          if (d.type === 'system-to-system') return 350;
          return 180;
        }).strength(0.4))
        .force('charge', d3.forceManyBody().strength(d => {
          if (d.type === 'system') return -1200;
          if (d.type === 'interface') return -600;
          return -400;
        }))
        // Y position by level
        .force('y', d3.forceY(d => {
          if (d.level === 1) return containerHeight * 0.2; // Systems at top
          if (d.level === 2) return containerHeight * 0.5; // Interfaces in middle
          return containerHeight * 0.8; // Dataflows at bottom
        }).strength(0.9))
        // Center X
        .force('x', d3.forceX(containerWidth / 2).strength(0.05))
        // Prevent collisions
        .force('collision', d3.forceCollide().radius(d => {
          if (d.type === 'system') return 100;
          if (d.type === 'interface') return 50;
          return 60;
        }).strength(0.7))
        // Custom force for distributing nodes within levels
        .force('levelSpread', alpha => {
          const levelNodesCount = { 1: 0, 2: 0, 3: 0 };
          const levelNodes = { 1: [], 2: [], 3: [] };
          
          // Count and collect nodes by level
          graphData.nodes.forEach(node => {
            if (node.level) {
              levelNodesCount[node.level]++;
              levelNodes[node.level].push(node);
            }
          });
          
          // Distribute nodes horizontally within levels
          Object.keys(levelNodes).forEach(level => {
            const nodes = levelNodes[level];
            const spacing = containerWidth / (nodes.length + 1);
            
            nodes.forEach((node, i) => {
              // Target X position
              const targetX = spacing * (i + 1);
              // Apply force
              const dx = targetX - node.x;
              node.vx += dx * alpha * 0.3;
            });
          });
        });
    } else if (currentMode === 'technical') {
      // Technical mode - more detailed layout
      simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(d => {
          // Vary distances by link type
          if (d.type === 'system-to-dataflow' || d.type === 'dataflow-to-system') {
            return 180;
          }
          if (d.type === 'dataflow-to-interface') {
            return 130;
          }
          if (d.type === 'interface-to-interface') {
            return 100;
          }
          if (d.type === 'system-to-system') {
            return 350;
          }
          return 200;
        }).strength(0.3))
        .force('charge', d3.forceManyBody().strength(d => {
          // Stronger repulsion for systems
          if (d.type === 'system') {
            // Key systems have stronger repulsion
            if (d.id.includes('MIRA') || d.id.includes('GAS-X') || d.id.includes('VHP')) {
              return -2000;
            }
            return -1800;
          }
          if (d.type === 'interface') return -900;
          return -600;
        }))
        // Weak center force
        .force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2).strength(0.05))
        // Strong collision detection
        .force('collision', d3.forceCollide().radius(d => {
          if (d.type === 'system') return 100;
          if (d.type === 'interface') return 60;
          return 50;
        }).strength(0.85).iterations(2))
        // Radial force for systems
        .force('radial', d3.forceRadial(d => {
          if (d.type === 'system' && 
              (d.id.includes('MIRA') || d.id.includes('GAS-X') || d.id.includes('VHP'))) {
            return Math.min(containerWidth, containerHeight) * 0.40;
          }
          if (d.type === 'system') {
            return Math.min(containerWidth, containerHeight) * 0.25;
          }
          return 0;
        }, containerWidth / 2, containerHeight / 2).strength(d => {
          return d.type === 'system' ? 0.3 : 0;
        }))
        // Weak center-pulling forces
        .force('x', d3.forceX(containerWidth / 2).strength(0.02))
        .force('y', d3.forceY(containerHeight / 2).strength(0.02));

      // Custom force to cluster by type
      simulation.force('type-clustering', alpha => {
        const typeClustersCenters = {
          'system': { x: containerWidth * 0.5, y: containerHeight * 0.3 },
          'interface': { x: containerWidth * 0.5, y: containerHeight * 0.6 },
          'dataflow': { x: containerWidth * 0.5, y: containerHeight * 0.7 }
        };
        
        graphData.nodes.forEach(node => {
          if (node.type && typeClustersCenters[node.type]) {
            const center = typeClustersCenters[node.type];
            node.vx += (center.x - node.x) * alpha * 0.1;
            node.vy += (center.y - node.y) * alpha * 0.1;
          }
        });
      });
    }
    
    // Save simulation reference
    simulationRef.current = simulation;
    
    // Update path calculations for curved links
    const updateLinkPaths = () => {
      link.attr('d', d => {
        const source = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
        
        if (!source || !target || 
            source.x === undefined || source.y === undefined || 
            target.x === undefined || target.y === undefined) {
          // Return a minimal valid path if coordinates aren't ready
          return 'M0,0 L0,0';
        }
        
        // For system-to-system, add a curve
        if (d.type === 'system-to-system') {
          // Calculate midpoint and offset it
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 - 40; // Offset upward
          
          // Make sure the path has valid coordinates
          if (isNaN(source.x) || isNaN(source.y) || isNaN(midX) || isNaN(midY) || isNaN(target.x) || isNaN(target.y)) {
            return 'M0,0 L0,0';
          }
          
          return `M${source.x},${source.y} Q${midX},${midY} ${target.x},${target.y}`;
        }
        
        // For other links, use straight lines with slight offset to avoid overlap
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        
        // Verify we have valid numbers before calculation
        if (isNaN(dx) || isNaN(dy) || dx === 0 && dy === 0) {
          return 'M0,0 L0,0'; 
        }
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normal vector for offset (with validation)
        let nx = 0, ny = 0;
        if (distance > 0) {
          nx = -dy / distance * 5;
          ny = dx / distance * 5;
        }
        
        // Adjust midpoint for curve
        const midX = (source.x + target.x) / 2 + nx;
        const midY = (source.y + target.y) / 2 + ny;
        
        if (isNaN(source.x) || isNaN(source.y) || isNaN(midX) || isNaN(midY) || isNaN(target.x) || isNaN(target.y)) {
          return 'M0,0 L0,0';
        }
        
        return `M${source.x},${source.y} Q${midX},${midY} ${target.x},${target.y}`;
      });
    };
    
    // Update node and link positions on each tick
    simulation.on('tick', () => {
      updateLinkPaths();
      
      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
    
    // Run simulation with more iterations for better layout
    simulation.alpha(0.5).restart();
    setSimulationRunning(true);
    
    // After some time, stabilize
    setTimeout(() => {
      simulation.alphaTarget(0);
      setSimulationRunning(false);
    }, 3000);
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep node fixed at dragged position
    }
    
    // Initial highlighting if a node is selected
    if (selectedNode) {
      setTimeout(() => {
        highlightConnections(selectedNode);
      }, 500);
    }
    
    // Clean up
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (tooltipRef.current) {
        tooltipRef.current.style('opacity', 0);
      }
    };
  }, [
    graphData, 
    getNodeColor, 
    getLinkColor, 
    getLinkStyle, 
    handleNodeClick, 
    getTooltipContent, 
    getLinkTooltipContent,
    getNodeRadius,
    handleNodeDrag,
    selectedNode,
    highlightConnections,
    currentMode,
    resetHighlighting,
    colorPalette,
    getSystemColor
  ]);
  
  return (
    <div className={`enhanced-network-graph-container ${currentMode}-mode`}>
      {simulationRunning && (
        <div className="simulation-indicator">
          Optimizing visualization...
        </div>
      )}
      <svg ref={svgRef} className="enhanced-network-graph"></svg>
      {graphData.nodes.length === 0 && (
        <div className="no-data-message">
          No data available. Please adjust your filters.
        </div>
      )}
      
      {/* Mode-specific controls */}
      {currentMode === 'technical' && (
        <div className="technical-controls">
          <div className="technical-controls-header">Technical Tools</div>
          <div className="technical-controls-item">
            <button className="technical-button">Health Check</button>
          </div>
          <div className="technical-controls-item">
            <button className="technical-button">Diagnostics</button>
          </div>
          <div className="technical-controls-item">
            <button className="technical-button">Flow Logs</button>
          </div>
        </div>
      )}
      
      {/* Mode-specific overlays */}
      {currentMode === 'focused' && selectedSystem && (
        <div className="focused-overlay">
          <div className="context-message">
            Showing flows connected to {selectedSystem}
          </div>
        </div>
      )}
      
      {currentMode === 'focused' && !selectedSystem && (
        <div className="focused-overlay">
          <div className="context-message">
            Select a system to focus on its connections
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNetworkGraph;