import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, useReactFlow, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElements } from '../utils/layout';
import { parseServiceDAG } from '../utils/parseService';
import sampleData from '../data/sample.json';
import { v4 as uuidv4 } from 'uuid';
import { Search, ArrowRight } from 'lucide-react';

export default function DAGFlow() {
  // Create multiple root DAGs with UUIDs only
  const dagList = useMemo(() => {
    return Array.from({ length: 5 }).map(() => {
      const parsed = parseServiceDAG(structuredClone(sampleData));

      // Label root nodes as Project1, Project2, ...
      parsed.nodes.forEach((node, nIdx) => {
        node.label = `Project${nIdx + 1}`;
      });

      const { nodes, edges } = getLayoutedElements(parsed.nodes, parsed.edges);

      return {
        id: uuidv4(), // only UUID in sidebar
        parsed,
        nodes,
        edges,
      };
    });
  }, []);

  const [activeDAGId, setActiveDAGId] = useState(dagList[0].id);
  const [searchText, setSearchText] = useState('');
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Racine']);
  const [activeGraph, setActiveGraph] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: dagList[0].nodes,
    edges: dagList[0].edges,
  });
  const [isInChild, setIsInChild] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const childFlowRef = useRef<ReturnType<typeof useReactFlow> | null>(null);

  const filteredDAGs = dagList.filter((dag) =>
    dag.id.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeDAG = dagList.find((d) => d.id === activeDAGId)!;

// Helper to generate nodes/edges for a given DAG structure
function buildGraphFromData(data: any[], isChild = false) {
  return data.map((item, idx) => ({
    id: isChild ? `app-${idx}` : `proj-${idx}`,
    label: isChild ? `Application${idx + 1}` : `Project${idx + 1}`,
    data: item,
    position: { x: idx * 200, y: 0 },
  }));
}

// Recenter graph when a node is selected (table appears) or deselected
useEffect(() => {
  setTimeout(() => {
    childFlowRef.current?.fitView({ padding: 0.1 }); // small padding for better view
  }, 50);
}, [selectedNode]);

function buildEdges(data: any[], isChild = false) {
  const edges: Edge[] = [];
  data.forEach((item, idx) => {
    if (item.output) {
      const targetIdx = data.findIndex((d) => d.name === item.output);
      if (targetIdx >= 0) {
        edges.push({
          id: `${isChild ? 'app' : 'proj'}-edge-${idx}-${targetIdx}`,
          source: isChild ? `app-${idx}` : `proj-${idx}`,
          target: isChild ? `app-${targetIdx}` : `proj-${targetIdx}`,
        });
      }
    }
  });
  return edges;
}

// Updated handleNodeClick using parseServiceDAG structure
const handleNodeClick = (_: unknown, node: Node) => {
  const nodeData = node.data;

  // Check if this node has children (child DAGs)
  if (nodeData?.children?.length) {
    // For simplicity, take the first child group (you could allow multiple)
    const childGroup = nodeData.children[0];
    console.log(childGroup)
      console.log(nodeData.children)
    // Use the precomputed nodes and edges directly
    setActiveGraph({ nodes: childGroup.nodes, edges: childGroup.edges });
    setIsInChild(true);
    setBreadcrumb(['Racine', node.label]);
    setSelectedNode(null);
  } else if (isInChild) {
    // Node clicked in child graph → show table
    setSelectedNode(node);
  }
};



  // Breadcrumb click
  const handleBreadcrumbClick = (levelIndex: number) => {
    if (levelIndex === 0) {
      setActiveGraph({ nodes: activeDAG.nodes, edges: activeDAG.edges });
      setIsInChild(false);
      setBreadcrumb(['Racine']);
      setSelectedNode(null);
    }
  };

  useEffect(() => {
    setTimeout(() => childFlowRef.current?.fitView(), 20);
  }, [activeGraph]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* HEADER */}
<header
  style={{
    height: '60px',
        background: '#2a2a3f', // purple header
            borderBottom: '1px solid #3c3c5e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
  }}
>
  RandomGraphApp
</header>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR */}
        <aside
style={{
    width: '280px',
    background: '#2a2a3f',
    borderRight: '1px solid #3c3c5e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    gap: '1rem',
  }}
        >
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <textarea
    value={filteredDAGs.map(d => d.id).join('\n')} // each ID on a new line
    readOnly // optional: make it readonly so user cannot edit
    style={{
   width: '100%',
    height: '80px',
    background: '#1f1f2e',
    color: '#fff',
    border: '1px solid #5e5e8f',
    borderRadius: 6,
    padding: '0.5rem',
    resize: 'none',
    fontSize: '0.85rem',
    overflowY: 'auto',          // enable vertical scrolling
    scrollbarWidth: 'thin',      // Firefox
    scrollbarColor: '#9f7aea #1f1f2e', // Firefox: thumb and track
    }}
  />
            <button
              onClick={() => alert(`Searching for: ${searchText}`)}
              style={{
                border: 'none',
                background: '#007aff',
                color: 'white',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={16} />
            </button>
          </div>

          {/* DAG cards: only UUIDs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {filteredDAGs.map((dag) => (
              <div
                key={dag.id}
                onClick={() => {
                  setActiveDAGId(dag.id);
                  setActiveGraph({ nodes: dag.nodes, edges: dag.edges });
                  setBreadcrumb(['Racine']);
                  setIsInChild(false);
                  setSelectedNode(null);
                }}
                style={{
                  cursor: 'pointer',
          padding: '0.75rem',
          borderRadius: 8,
          border: '1px solid #5e5e8f',
          background: dag.id === activeDAGId ? '#9f7aea' : '#3c3c5e',
          color: dag.id === activeDAGId ? '#fff' : '#ccc',
          fontWeight: dag.id === activeDAGId ? 600 : 400,
          textAlign: 'center',
          transition: 'all 0.2s',
                }}
              >
                {dag.id}
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
          {/* Breadcrumb */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '0.1px #eee',
              background: 'rgb(30, 30, 47)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: '#007aff',
            }}
          >
            {breadcrumb.map((item, idx) => (
              <span
                key={idx}
                onClick={() => handleBreadcrumbClick(idx)}
                style={{
                  cursor: idx === breadcrumb.length - 1 ? 'default' : 'pointer',
                  fontWeight: idx === breadcrumb.length - 1 ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                
                  textDecoration: idx === breadcrumb.length - 1 ? 'none' : 'underline',
                }}
              >
                {item}
                {idx < breadcrumb.length - 1 && <ArrowRight size={14} />}
              </span>
            ))}
          </div>

          {/* Graph + Table */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
              style={{
                flex: selectedNode ? 0.5 : 1,
                borderBottom: selectedNode ? '1px solid #ccc' : 'none',
                background: '#252531ff' 
              }}
            >
             <ReactFlow
  nodes={activeGraph.nodes.map((node) => ({
    ...node,
    style: {
      background: selectedNode?.id === node.id ? '#9f7aea' : '#6b46c1', // active node
      color: '#fff',
      border: selectedNode?.id === node.id ? '2px solid #d6bcfa' : '1px solid #9f7aea',
      borderRadius: 8,
      padding: 10,
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      transition: 'all 0.2s',
    },
    // optional: hover effect using className + CSS
    className: 'reactflow-node-dark',
  }))}
  edges={activeGraph.edges.map((edge) => ({
    ...edge,
    style: { stroke: '#9f7aea', strokeWidth: 2 },
    animated: false,
  }))}
  fitView
  onNodeClick={handleNodeClick}
  onInit={(instance) => {
    childFlowRef.current = instance;
    instance.fitView({ padding: 0.1 });
  }}
>
    <Background color="#3c3c5e" gap={10000} /> {/* grid lines */}
    <Controls style={{ background: '#2a2a3f', color: '#fff' }} />
</ReactFlow>

            </div>

            {/* Node table */}
{selectedNode && (
  <div style={{ flex: 0.5, overflowY: 'auto', padding: '1rem', background: '#1e1e2f' }}>
    <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>Details for node: {selectedNode.label}</h3>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#2a2a3f',
        color: '#fff',
        border: '1px solid #3c3c5e',
      }}
    >
      <thead style={{ background: '#3c3c5e' }}>
        <tr>
          <th style={{ padding: '8px', border: '1px solid #3c3c5e' }}>Property</th>
          <th style={{ padding: '8px', border: '1px solid #3c3c5e' }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(selectedNode.data || { Example: 'No data available' }).map(([key, value]) => (
          <tr key={key}>
            <td style={{ padding: '8px', border: '1px solid #3c3c5e' }}>{key}</td>
            <td style={{ padding: '8px', border: '1px solid #3c3c5e' }}>{String(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  );
}
