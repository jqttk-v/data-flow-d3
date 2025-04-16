// src/components/DynamicFlowSequence.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './DynamicFlowSequence.css';

/**
 * Component that visualizes the data flow sequence dynamically
 * Shows clear directional flow with animated arrows between process steps
 */
const DynamicFlowSequence = ({ dataFlow, colorPalette }) => {
  const svgRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const animationTimerRef = useRef(null);

  // Get format color based on format name
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

  // Get system color based on system name
  const getSystemColor = (systemName) => {
    if (!systemName) return '#999999';
    
    if (systemName.includes('MIRA') || systemName.includes('MISA')) return colorPalette.primary || '#C63441';
    if (systemName.includes('Marktpartner')) return colorPalette.tertiary || '#C0BCAC';
    if (systemName.includes('GAS-X-GRID')) return colorPalette.secondary || '#96BEBE';
    if (systemName.includes('GAS-X-BKN') || systemName.includes('GAS-X-BEN')) return colorPalette.accent1 || '#E1BA50';
    if (systemName.includes('VHP')) return colorPalette.accent2 || '#677488';
    return '#999999';
  };

  // Start/stop animation
  const toggleAnimation = () => {
    if (isPlaying) {
      clearInterval(animationTimerRef.current);
      setIsPlaying(false);
    } else {
      setCurrentStep(0);
      setIsPlaying(true);
      animationTimerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const maxSteps = dataFlow?.process_steps?.length || 0;
          if (prev >= maxSteps) {
            clearInterval(animationTimerRef.current);
            setIsPlaying(false);
            return maxSteps;
          }
          return prev + 1;
        });
      }, 1500); // 1.5 seconds per step
    }
  };

  // Generate the entire flow sequence visualization
  useEffect(() => {
    if (!svgRef.current || !dataFlow) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;
    
    svg.attr('width', width)
       .attr('height', height)
       .attr('viewBox', `0 0 ${width} ${height}`);

    // Draw background
    svg.append('rect')
       .attr('width', width)
       .attr('height', height)
       .attr('fill', '#f8fafc')
       .attr('rx', 8)
       .attr('ry', 8);
    
    // Create definitions for markers (arrowheads)
    const defs = svg.append('defs');
    
    // Create main arrowhead
    defs.append('marker')
        .attr('id', 'arrow-flow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .append('path')
        .attr('d', 'M0,-5 L10,0 L0,5')
        .attr('fill', getFormatColor(dataFlow.format));
    
    // Create animated arrowhead
    defs.append('marker')
        .attr('id', 'arrow-flow-animated')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .append('path')
        .attr('d', 'M0,-5 L10,0 L0,5')
        .attr('fill', '#ff5722');
    
    // Title for the flow visualization
    svg.append('text')
       .attr('x', width / 2)
       .attr('y', 30)
       .attr('text-anchor', 'middle')
       .attr('font-size', '16px')
       .attr('font-weight', 'bold')
       .text(`${dataFlow.n || dataFlow.id} (${dataFlow.format || 'Unknown Format'})`);
    
    // Start with source and target systems
    const sourceSystem = {
      id: dataFlow.source_system,
      type: 'system',
      x: 100,
      y: height / 2 - 80,
      isSource: true
    };
    
    const targetSystem = {
      id: dataFlow.target_system,
      type: 'system',
      x: width - 100,
      y: height / 2 - 80,
      isTarget: true
    };
    
    // Extract all process steps and create unified nodes
    const processSteps = dataFlow.process_steps ? [...dataFlow.process_steps] : [];
    
    // If no process steps, create a direct flow
    if (processSteps.length === 0) {
      // Draw source system
      drawSystem(svg, sourceSystem, getSystemColor);
      
      // Draw target system
      drawSystem(svg, targetSystem, getSystemColor);
      
      // Draw direct connection with animation
      const directPath = svg.append('path')
        .attr('d', `M${sourceSystem.x + 80},${sourceSystem.y + 40} C${sourceSystem.x + 200},${sourceSystem.y - 20} ${targetSystem.x - 200},${targetSystem.y - 20} ${targetSystem.x},${targetSystem.y + 40}`)
        .attr('stroke', getFormatColor(dataFlow.format))
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrow-flow)')
        .attr('class', 'flow-path');
      
      // Add animated particles
      animatePath(svg, directPath, getFormatColor(dataFlow.format));
      
      // Draw format badge in the middle
      svg.append('rect')
        .attr('x', width / 2 - 40)
        .attr('y', height / 2 - 140)
        .attr('width', 80)
        .attr('height', 30)
        .attr('rx', 15)
        .attr('ry', 15)
        .attr('fill', getFormatColor(dataFlow.format));
      
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 - 120)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .text(dataFlow.format || '');
      
      // Draw transmission method
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 - 90)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text(dataFlow.transmission_method || '');
      
    } else {
      // We have process steps - create a more detailed flow
      
      // All nodes including systems and interfaces
      const nodes = [
        sourceSystem,
        targetSystem
      ];
      
      // Extract all interfaces from process steps
      const interfaceMap = new Map();
      
      processSteps.forEach((step, index) => {
        const interfaceId = step.interface;
        if (!interfaceMap.has(interfaceId)) {
          // Calculate x position distributed between source and target
          const stepCount = processSteps.length;
          const portionOfWidth = (width - 200) / (stepCount + 1);
          const xPos = 100 + portionOfWidth * (index + 1);
          
          interfaceMap.set(interfaceId, {
            id: interfaceId,
            type: 'interface',
            steps: [step],
            x: xPos,
            y: height / 2 + 20
          });
        } else {
          // Add this step to existing interface
          interfaceMap.get(interfaceId).steps.push(step);
        }
      });
      
      // Add interfaces to nodes
      interfaceMap.forEach(interfaceNode => {
        nodes.push(interfaceNode);
      });
      
      // Sort process steps by position
      const sortedSteps = [...processSteps].sort((a, b) => {
        return (a.position || 0) - (b.position || 0);
      });
      
      // Create links between nodes following the process step order
      const links = [];
      
      // If steps have positions, create a sequential path
      if (sortedSteps.length > 0 && sortedSteps[0].position) {
        let prevNode = sourceSystem;
        
        sortedSteps.forEach((step, index) => {
          const interfaceNode = Array.from(interfaceMap.values())
            .find(node => node.id === step.interface);
          
          if (interfaceNode) {
            links.push({
              source: prevNode,
              target: interfaceNode,
              stepType: step.step_type,
              stepIndex: index,
              format: dataFlow.format
            });
            
            prevNode = interfaceNode;
          }
        });
        
        // Connect last interface to target system
        if (prevNode !== sourceSystem) {
          links.push({
            source: prevNode,
            target: targetSystem,
            stepType: 'delivery',
            stepIndex: sortedSteps.length,
            format: dataFlow.format
          });
        }
      } 
      // If no positions, use the step type to infer direction
      else {
        let currentSource = sourceSystem;
        
        sortedSteps.forEach((step, index) => {
          const interfaceNode = Array.from(interfaceMap.values())
            .find(node => node.id === step.interface);
          
          if (interfaceNode) {
            if (step.step_type === 'delivery') {
              links.push({
                source: currentSource,
                target: interfaceNode,
                stepType: 'delivery',
                stepIndex: index,
                format: dataFlow.format
              });
              currentSource = interfaceNode;
            } else if (step.step_type === 'reception') {
              links.push({
                source: currentSource,
                target: interfaceNode,
                stepType: 'reception',
                stepIndex: index,
                format: dataFlow.format
              });
              currentSource = interfaceNode;
            }
          }
        });
        
        // Connect last node to target system
        links.push({
          source: currentSource,
          target: targetSystem,
          stepType: 'delivery',
          stepIndex: sortedSteps.length,
          format: dataFlow.format
        });
      }
      
      // Draw all nodes
      nodes.forEach(node => {
        if (node.type === 'system') {
          drawSystem(svg, node, getSystemColor);
        } else if (node.type === 'interface') {
          drawInterface(svg, node);
        }
      });
      
      // Draw all links
      links.forEach((link, index) => {
        const source = link.source;
        const target = link.target;
        
        // Determine start and end points based on node types
        let startX, startY, endX, endY;
        
        if (source.type === 'system') {
          startX = source.x + 80; // Right side of system box
          startY = source.y + 40; // Middle of system box
        } else if (source.type === 'interface') {
          startX = source.x; // Center of interface
          startY = source.y + 30; // Bottom of interface
        }
        
        if (target.type === 'system') {
          endX = target.x; // Left side of system box
          endY = target.y + 40; // Middle of system box
        } else if (target.type === 'interface') {
          endX = target.x; // Center of interface
          endY = target.y - 30; // Top of interface
        }
        
        // Create curved path
        const path = svg.append('path')
          .attr('d', () => {
            // If going from interface to interface, use S-curve
            if (source.type === 'interface' && target.type === 'interface') {
              return `M${startX},${startY} C${startX},${startY + 50} ${endX},${endY + 50} ${endX},${endY}`;
            }
            // If going from system to interface
            else if (source.type === 'system' && target.type === 'interface') {
              return `M${startX},${startY} C${startX + 50},${startY} ${endX - 50},${endY - 50} ${endX},${endY}`;
            }
            // If going from interface to system
            else if (source.type === 'interface' && target.type === 'system') {
              return `M${startX},${startY} C${startX + 50},${startY + 50} ${endX - 50},${endY} ${endX},${endY}`;
            }
            // Direct system to system (rare case)
            else {
              return `M${startX},${startY} C${startX + 100},${startY - 50} ${endX - 100},${endY - 50} ${endX},${endY}`;
            }
          })
          .attr('stroke', getFormatColor(dataFlow.format))
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .attr('marker-end', 'url(#arrow-flow)')
          .attr('class', `flow-path step-${index}`);
        
        // Add animated particles
        animatePath(svg, path, getFormatColor(dataFlow.format));
        
        // Add step type label
        const pathNode = path.node();
        if (pathNode) {
          const pathLength = pathNode.getTotalLength();
          const midpoint = pathNode.getPointAtLength(pathLength / 2);
          
          svg.append('text')
            .attr('x', midpoint.x)
            .attr('y', midpoint.y - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .text(link.stepType);
        }
      });
      
      // Draw step positions
      sortedSteps.forEach((step, index) => {
        const interfaceNode = Array.from(interfaceMap.values())
          .find(node => node.id === step.interface);
        
        if (interfaceNode) {
          svg.append('circle')
            .attr('cx', interfaceNode.x - 25)
            .attr('cy', interfaceNode.y - 25)
            .attr('r', 12)
            .attr('fill', '#6366f1')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
          
          svg.append('text')
            .attr('x', interfaceNode.x - 25)
            .attr('y', interfaceNode.y - 21)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '11px')
            .text(step.position || (index + 1));
        }
      });
    }
    
    // Add a progress bar at the bottom
    if (dataFlow.process_steps && dataFlow.process_steps.length > 0) {
      const progressBarWidth = width - 200;
      const progressBarHeight = 8;
      const progressBarX = 100;
      const progressBarY = height - 40;
      
      // Background
      svg.append('rect')
        .attr('x', progressBarX)
        .attr('y', progressBarY)
        .attr('width', progressBarWidth)
        .attr('height', progressBarHeight)
        .attr('rx', 4)
        .attr('fill', '#e5e7eb');
      
      // Progress indicator
      const progressWidth = (currentStep / dataFlow.process_steps.length) * progressBarWidth;
      
      svg.append('rect')
        .attr('x', progressBarX)
        .attr('y', progressBarY)
        .attr('width', progressWidth)
        .attr('height', progressBarHeight)
        .attr('rx', 4)
        .attr('fill', getFormatColor(dataFlow.format));
      
      // Step labels
      dataFlow.process_steps.forEach((step, index) => {
        const stepX = progressBarX + (progressBarWidth * (index + 1)) / (dataFlow.process_steps.length + 1);
        
        svg.append('circle')
          .attr('cx', stepX)
          .attr('cy', progressBarY + 4)
          .attr('r', currentStep > index ? 6 : 4)
          .attr('fill', currentStep > index ? getFormatColor(dataFlow.format) : '#94a3b8');
        
        svg.append('text')
          .attr('x', stepX)
          .attr('y', progressBarY + 25)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('fill', currentStep > index ? '#1f2937' : '#94a3b8')
          .text(`Step ${index + 1}`);
      });
    }
  }, [dataFlow, currentStep, getSystemColor, getFormatColor]);
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);
  
  if (!dataFlow) {
    return <div className="no-flow-selected">Bitte wählen Sie einen Datenfluss aus</div>;
  }
  
  return (
    <div className="dynamic-flow-sequence">
      <div className="flow-controls">
        <button 
          className={`play-button ${isPlaying ? 'pause' : 'play'}`} 
          onClick={toggleAnimation}
          aria-label={isPlaying ? 'Pause Animation' : 'Play Animation'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <div className="flow-info">
          <div className="flow-title">{dataFlow.n || dataFlow.id}</div>
          <div className="flow-format" style={{ backgroundColor: getFormatColor(dataFlow.format) }}>
            {dataFlow.format}
          </div>
        </div>
      </div>
      <div className="flow-visualization">
        <svg ref={svgRef}></svg>
      </div>
      <div className="flow-details">
        <div className="flow-path-info">
          <div className="path-start">{dataFlow.source_system}</div>
          <div className="path-arrow">→</div>
          {dataFlow.process_steps && dataFlow.process_steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`path-step ${currentStep > index ? 'completed' : ''}`}>
                {step.interface}
              </div>
              <div className="path-arrow">→</div>
            </React.Fragment>
          ))}
          <div className="path-end">{dataFlow.target_system}</div>
        </div>
        <div className="flow-description">
          {dataFlow.description}
        </div>
      </div>
    </div>
  );
};

// Helper function to draw a system node
function drawSystem(svg, node, getSystemColor) {
  const systemGroup = svg.append('g')
    .attr('class', 'system-node');
  
  // System box
  systemGroup.append('rect')
    .attr('x', node.x)
    .attr('y', node.y)
    .attr('width', 160)
    .attr('height', 80)
    .attr('rx', 8)
    .attr('fill', 'white')
    .attr('stroke', '#333333')
    .attr('stroke-width', 2);
  
  // System header
  systemGroup.append('rect')
    .attr('x', node.x)
    .attr('y', node.y)
    .attr('width', 160)
    .attr('height', 24)
    .attr('rx', 8)
    .attr('ry', 0)
    .attr('fill', getSystemColor(node.id));
  
  // System name
  systemGroup.append('text')
    .attr('x', node.x + 80)
    .attr('y', node.y + 16)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .text(node.id);
  
  // System type
  const systemType = node.id.includes('MIRA') ? 'Market Partner System' :
                     node.id.includes('GAS-X-GRID') ? 'Network Operation' :
                     node.id.includes('GAS-X-BKN') ? 'Balance Group Network' :
                     node.id.includes('VHP') ? 'Virtual Hub Portal' :
                     node.id.includes('Marktpartner') ? 'External Partner' :
                     'System';
  
  systemGroup.append('text')
    .attr('x', node.x + 80)
    .attr('y', node.y + 50)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4b5563')
    .attr('font-size', 12)
    .text(systemType);
  
  // Source/Target indicator
  if (node.isSource) {
    systemGroup.append('text')
      .attr('x', node.x - 10)
      .attr('y', node.y + 40)
      .attr('text-anchor', 'end')
      .attr('fill', '#4b5563')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .text('→');
  } else if (node.isTarget) {
    systemGroup.append('text')
      .attr('x', node.x + 170)
      .attr('y', node.y + 40)
      .attr('text-anchor', 'start')
      .attr('fill', '#4b5563')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .text('→');
  }
}

// Helper function to draw an interface node
function drawInterface(svg, node) {
  const interfaceGroup = svg.append('g')
    .attr('class', 'interface-node');
  
  // Create hexagon shape for interface
  const hexRadius = 30;
  const hexPoints = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI / 3) - (Math.PI / 2); // Start from top
    hexPoints.push([
      node.x + hexRadius * Math.cos(angle),
      node.y + hexRadius * Math.sin(angle)
    ]);
  }
  
  // Hexagonal shape
  interfaceGroup.append('polygon')
    .attr('points', hexPoints.map(p => p.join(',')).join(' '))
    .attr('fill', '#f8fafc')
    .attr('stroke', '#333333')
    .attr('stroke-width', 2);
  
  // Interface icon
  interfaceGroup.append('text')
    .attr('x', node.x)
    .attr('y', node.y + 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666666')
    .attr('font-size', 16)
    .attr('font-family', 'monospace')
    .text('{ }');
  
  // Interface name - truncated if too long
  const interfaceName = node.id.length > 20 ? node.id.substring(0, 17) + '...' : node.id;
  
  interfaceGroup.append('text')
    .attr('x', node.x)
    .attr('y', node.y + 70)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4b5563')
    .attr('font-size', 10)
    .text(interfaceName);
}

// Helper function to add animated particles along a path
function animatePath(svg, path, color) {
  const pathNode = path.node();
  if (!pathNode) return;
  
  const pathLength = pathNode.getTotalLength();
  const particleCount = Math.max(1, Math.floor(pathLength / 100));
  
  for (let i = 0; i < particleCount; i++) {
    const particle = svg.append('circle')
      .attr('r', 3)
      .attr('fill', color)
      .attr('filter', 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))');
    
    animateParticle(particle, pathNode, pathLength, i, particleCount);
  }
}

// Animation function for particles
function animateParticle(particle, pathNode, pathLength, offset, count) {
  // Repeat time varies with path length
  const animDuration = 3000 + (pathLength / 10);
  
  function updatePosition() {
    const now = Date.now();
    // Offset each particle in time
    let phase = ((now % animDuration) / animDuration) + (offset / count);
    if (phase > 1) phase -= 1;
    
    try {
      const point = pathNode.getPointAtLength(pathLength * phase);
      particle.attr('cx', point.x).attr('cy', point.y);
    } catch (e) {
      // Handle invalid path gracefully
    }
    
    requestAnimationFrame(updatePosition);
  }
  
  updatePosition();
}

export default DynamicFlowSequence;