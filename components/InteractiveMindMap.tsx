





import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MindMapNodeData } from '../types';
import { createMindMapLayout, LayoutNode, LayoutLink } from '../utils/mindMapLayout';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ResetViewIcon } from './icons/ResetViewIcon';
import Button from './Button';

type InteractiveMindMapProps = {
  root: MindMapNodeData;
};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

function InteractiveMindMap({ root }: InteractiveMindMapProps) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, links } = useMemo(() => createMindMapLayout(root, NODE_WIDTH, NODE_HEIGHT, 50, 80), [root]);

  useEffect(() => {
    // Center the view on initial render
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      setTransform(prev => ({ ...prev, x: width / 2, y: height / 4 }));
    }
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(3, transform.scale + scaleAmount));

    if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Apply zoom relative to mouse position
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

        setTransform({ scale: newScale, x: newX, y: newY });
    }
  };

  const zoom = (direction: 'in' | 'out') => {
    const scaleFactor = 1.2;
    const newScale = direction === 'in' ? transform.scale * scaleFactor : transform.scale / scaleFactor;
    setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(3, newScale)) }));
  };

  const resetView = () => {
    if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setTransform({ scale: 1, x: width / 2, y: height / 4 });
    }
  };


  const getLinkPath = (link: LayoutLink) => {
    const { source, target } = link;
    return `M${source.x},${source.y + source.height / 2} C${source.x},${(source.y + target.y) / 2} ${target.x},${(source.y + target.y) / 2} ${target.x},${target.y - target.height / 2}`;
  };

  return (
    <div className="w-full h-full relative select-none">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="cursor-grab active:cursor-grabbing"
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {links.map((link, i) => (
            <path
              key={i}
              d={getLinkPath(link)}
              className="fill-none stroke-slate-300 dark:stroke-slate-600"
              strokeWidth="2"
            />
          ))}
          {nodes.map((node, i) => (
            <g key={i} transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}>
              <rect
                width={node.width}
                height={node.height}
                rx="8"
                className="fill-white dark:fill-slate-700 stroke-primary-500"
                strokeWidth="2"
              />
              <text
                x={node.width / 2}
                y={node.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-800 dark:fill-slate-100 font-medium"
                style={{ pointerEvents: 'none' }}
              >
                {node.topic}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Fix: Added children to Button components to resolve missing prop errors. */}
         <Button onClick={() => zoom('in')} variant="secondary" size="sm" className="!p-2"><ZoomInIcon className="w-5 h-5"/></Button>
         <Button onClick={() => zoom('out')} variant="secondary" size="sm" className="!p-2"><ZoomOutIcon className="w-5 h-5"/></Button>
         <Button onClick={resetView} variant="secondary" size="sm" className="!p-2"><ResetViewIcon className="w-5 h-5"/></Button>
      </div>
    </div>
  );
};

export default InteractiveMindMap;