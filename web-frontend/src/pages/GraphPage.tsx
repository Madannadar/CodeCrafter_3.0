import { useState, useRef, useEffect, useCallback } from 'react';
import { graphNodes, graphEdges, type GraphNode } from '../data/graphData';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function getMasteryColor(mastery: number): string {
  if (mastery >= 70) return '#10b981';
  if (mastery >= 45) return '#f59e0b';
  return '#ef4444';
}

function getCategoryRadius(category: string): number {
  if (category === 'subject') return 32;
  if (category === 'topic') return 26;
  return 20;
}

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const positionsRef = useRef<NodePosition[]>([]);
  const animFrameRef = useRef<number>(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragNodeRef = useRef<string | null>(null);

  // Initialize positions
  useEffect(() => {
    if (positionsRef.current.length > 0) return;
    const cx = 500, cy = 350;
    const positions: NodePosition[] = graphNodes.map((node, i) => {
      const angle = (i / graphNodes.length) * Math.PI * 2;
      const layerRadius = node.category === 'topic' ? 120 : node.category === 'subject' ? 250 : 380;
      return {
        id: node.id,
        x: cx + Math.cos(angle) * layerRadius + (Math.random() - 0.5) * 80,
        y: cy + Math.sin(angle) * layerRadius + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
      };
    });
    positionsRef.current = positions;
  }, []);

  const getPos = useCallback((id: string) => {
    return positionsRef.current.find((p) => p.id === id);
  }, []);

  // Force simulation
  useEffect(() => {
    let running = true;
    const simulate = () => {
      if (!running) return;
      const positions = positionsRef.current;
      const damping = 0.85;
      const repulsion = 3000;
      const springLength = 140;
      const springK = 0.008;
      const centerGravity = 0.001;
      const cx = 500, cy = 350;

      // Reset forces
      positions.forEach((p) => { p.vx *= damping; p.vy *= damping; });

      // Repulsion between all nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i], b = positions[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }

      // Spring forces along edges
      graphEdges.forEach((edge) => {
        const a = positions.find((p) => p.id === edge.source);
        const b = positions.find((p) => p.id === edge.target);
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - springLength;
        const force = springK * displacement;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });

      // Center gravity
      positions.forEach((p) => {
        if (dragNodeRef.current === p.id) return;
        p.vx += (cx - p.x) * centerGravity;
        p.vy += (cy - p.y) * centerGravity;
        p.x += p.vx;
        p.y += p.vy;
      });

      // Draw
      draw();
      animFrameRef.current = requestAnimationFrame(simulate);
    };

    simulate();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [hoveredNode, selectedNode, offset, zoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x + w / 2, offset.y + h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2);

    // Draw edges
    graphEdges.forEach((edge) => {
      const a = getPos(edge.source);
      const b = getPos(edge.target);
      if (!a || !b) return;

      const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isHighlighted ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.12)';
      ctx.lineWidth = isHighlighted ? 2.5 : 1;
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const targetNode = graphNodes.find((n) => n.id === edge.target);
      const r = getCategoryRadius(targetNode?.category || 'concept');
      const arrowX = b.x - Math.cos(angle) * (r + 4);
      const arrowY = b.y - Math.sin(angle) * (r + 4);
      const arrowSize = isHighlighted ? 8 : 5;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.2)';
      ctx.fill();
    });

    // Draw nodes
    graphNodes.forEach((node) => {
      const pos = getPos(node.id);
      if (!pos) return;

      const r = getCategoryRadius(node.category);
      const color = getMasteryColor(node.mastery);
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isConnected = selectedNode && graphEdges.some(
        (e) => (e.source === selectedNode.id && e.target === node.id) || (e.target === selectedNode.id && e.source === node.id)
      );
      const dimmed = selectedNode && !isSelected && !isConnected;

      // Glow effect
      if (isSelected || isHovered) {
        const gradient = ctx.createRadialGradient(pos.x, pos.y, r, pos.x, pos.y, r * 2.5);
        gradient.addColorStop(0, `${color}30`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x - r * 3, pos.y - r * 3, r * 6, r * 6);
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);

      // Mastery ring (background)
      ctx.fillStyle = dimmed ? 'rgba(15,17,23,0.8)' : '#1a1d2e';
      ctx.fill();
      ctx.strokeStyle = dimmed ? `${color}30` : color;
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
      ctx.stroke();

      // Mastery arc
      if (!dimmed) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 3, -Math.PI / 2, -Math.PI / 2 + (node.mastery / 100) * Math.PI * 2);
        ctx.strokeStyle = `${color}80`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = dimmed ? 'rgba(148,163,184,0.3)' : '#f1f5f9';
      ctx.font = `${node.category === 'subject' ? 'bold 11' : node.category === 'topic' ? '10' : '9'}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Wrap text for long labels
      const words = node.label.split(' ');
      if (words.length > 2 && r > 18) {
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), pos.x, pos.y - 5);
        ctx.fillText(words.slice(mid).join(' '), pos.x, pos.y + 8);
      } else {
        ctx.fillText(node.label, pos.x, pos.y);
      }
    });

    ctx.restore();
  }, [hoveredNode, selectedNode, offset, zoom, getPos]);

  // Canvas sizing
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Mouse interaction
  const getNodeAt = useCallback((mx: number, my: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const w = canvas.width, h = canvas.height;
    // Transform mouse coords into graph space
    const gx = (mx - offset.x - w / 2) / zoom + w / 2;
    const gy = (my - offset.y - h / 2) / zoom + h / 2;

    for (const node of graphNodes) {
      const pos = getPos(node.id);
      if (!pos) continue;
      const r = getCategoryRadius(node.category);
      const dx = gx - pos.x, dy = gy - pos.y;
      if (dx * dx + dy * dy <= r * r) return node;
    }
    return null;
  }, [offset, zoom, getPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    if (isDraggingRef.current && !dragNodeRef.current) {
      setOffset((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
      return;
    }

    if (dragNodeRef.current) {
      const w = canvas.width, h = canvas.height;
      const gx = (mx - offset.x - w / 2) / zoom + w / 2;
      const gy = (my - offset.y - h / 2) / zoom + h / 2;
      const pos = positionsRef.current.find((p) => p.id === dragNodeRef.current);
      if (pos) {
        pos.x = gx;
        pos.y = gy;
        pos.vx = 0;
        pos.vy = 0;
      }
      return;
    }

    const node = getNodeAt(mx, my);
    setHoveredNode(node?.id || null);
    canvas.style.cursor = node ? 'pointer' : 'grab';
  }, [getNodeAt, offset, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const node = getNodeAt(mx, my);

    if (node) {
      dragNodeRef.current = node.id;
      setSelectedNode(node);
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    }
  }, [getNodeAt]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragNodeRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  // Get connected info for selected node
  const prerequisites = selectedNode
    ? graphEdges.filter((e) => e.target === selectedNode.id).map((e) => graphNodes.find((n) => n.id === e.source)!).filter(Boolean)
    : [];
  const dependents = selectedNode
    ? graphEdges.filter((e) => e.source === selectedNode.id).map((e) => graphNodes.find((n) => n.id === e.target)!).filter(Boolean)
    : [];

  return (
    <div className="animate-fade-in h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">🔗 Prerequisite Graph</h1>
          <p className="text-text-secondary mt-1">Explore how concepts connect and identify root learning gaps</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-primary-light transition-colors cursor-pointer">+</button>
          <span className="text-xs text-text-muted w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-primary-light transition-colors cursor-pointer">−</button>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="ml-2 px-3 py-1.5 rounded-lg glass text-xs text-text-secondary hover:text-primary-light transition-colors cursor-pointer">Reset</button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100%-70px)]">
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 glass rounded-2xl overflow-hidden relative">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: 'grab' }}
          />
          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl p-3 text-xs space-y-2">
            <p className="text-text-muted font-medium mb-1">Mastery Level</p>
            {[
              { color: '#10b981', label: 'Strong (≥70%)' },
              { color: '#f59e0b', label: 'Moderate (45-69%)' },
              { color: '#ef4444', label: 'Weak (<45%)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary">{item.label}</span>
              </div>
            ))}
            <hr className="border-border-light my-1" />
            <p className="text-text-muted">
              <span className="font-medium">Drag</span> nodes · <span className="font-medium">Scroll</span> to zoom · <span className="font-medium">Click</span> for details
            </p>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="w-[300px] glass rounded-2xl p-5 animate-slide-in-left overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary">{selectedNode.label}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">✕</button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${getMasteryColor(selectedNode.mastery)}15` }}
              >
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: getMasteryColor(selectedNode.mastery) }}>{selectedNode.mastery}%</p>
                  <p className="text-[10px] text-text-muted">Mastery</p>
                </div>
              </div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedNode.category === 'subject' ? 'bg-primary/15 text-primary-light' :
                  selectedNode.category === 'topic' ? 'bg-accent/15 text-accent-light' :
                  'bg-surface-lighter text-text-muted'
                }`}>
                  {selectedNode.category}
                </span>
                {selectedNode.mastery < 45 && (
                  <p className="text-xs text-error mt-1">⚠️ Needs attention</p>
                )}
              </div>
            </div>

            {prerequisites.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Prerequisites</h4>
                <div className="space-y-1.5">
                  {prerequisites.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-lighter/50 hover:bg-surface-lighter transition-colors text-left cursor-pointer"
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getMasteryColor(n.mastery) }} />
                      <span className="text-sm text-text-primary truncate">{n.label}</span>
                      <span className="ml-auto text-xs text-text-muted">{n.mastery}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dependents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Leads To</h4>
                <div className="space-y-1.5">
                  {dependents.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-lighter/50 hover:bg-surface-lighter transition-colors text-left cursor-pointer"
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getMasteryColor(n.mastery) }} />
                      <span className="text-sm text-text-primary truncate">{n.label}</span>
                      <span className="ml-auto text-xs text-text-muted">{n.mastery}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.mastery < 45 && prerequisites.length > 0 && (
              <div className="mt-5 p-3 rounded-xl bg-error/10 border border-error/20">
                <p className="text-xs text-error font-medium mb-1">🔍 Root Cause Analysis</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Low mastery may stem from weak prerequisites:{' '}
                  {prerequisites.filter((p) => p.mastery < 50).map((p) => p.label).join(', ') || 'review foundation concepts'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
