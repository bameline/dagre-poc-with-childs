import { useEffect, useRef, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, type Node, type Edge, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElements } from '../utils/layout';
import { parseServiceDAG } from '../utils/parseService';
import sampleData from '../data/sample.json';

export default function DAGFlow() {
  const parsed = useMemo(() => parseServiceDAG(structuredClone(sampleData)), []);

  type SelectedChildDAG = {
    nodes: Node[];
    edges: Edge[];
  };

  const childFlowRefs = useRef<(ReturnType<typeof useReactFlow> | null)[]>([]);

  const [selectedChildren, setSelectedChildren] = useState<SelectedChildDAG[]>([]);
  const [activeParentNode, setActiveParentNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => getLayoutedElements(parsed.nodes, parsed.edges), [parsed]);

  // On click on element, if element has children, display them
  const handleNodeClick = (_: unknown, node: Node) => {
    // Hide existing child graphs if clicking the same parent node
    if (activeParentNode === node.id) {
      setSelectedChildren([]);
      setActiveParentNode(null);
      return;
    }

    const childGroups = parsed.childrenMap[node.id];
    if (childGroups) {
      const groupDAGs = childGroups.map((group) => {
        // Nodes and edges are already processed and layouted in parseServiceDAG
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(group.nodes, group.edges);
        return { nodes: layoutedNodes, edges: layoutedEdges };
      });

      setSelectedChildren(groupDAGs);
      setActiveParentNode(node.id);
    } else {
      setSelectedChildren([]);
      setActiveParentNode(null);
    }
  };

  // Auto-fit child views on display
  useEffect(() => {
    childFlowRefs.current.forEach((instance) => {
      setTimeout(() => {
        instance?.fitView();
      }, 5);
    });
  }, [selectedChildren]);

  return (
    <div style={{ width: '100%', padding: '1rem' }}>
      <h2>Main Service DAG</h2>
      <div style={{ height: 100, border: '1px solid #ccc' }}>
        <ReactFlow nodes={nodes} edges={edges} onNodeClick={handleNodeClick} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {selectedChildren.length > 0 && (
        <>
          <h2>Children DAG(s)</h2>
          {selectedChildren.map((group, idx) => (
            <div key={idx} style={{ height: 100, marginTop: '1rem', border: '1px solid #aaa' }}>
              <ReactFlow
                nodes={group.nodes}
                edges={group.edges}
                fitView
                onInit={(instance) => {
                  childFlowRefs.current[idx] = instance;
                  instance.fitView();
                }}
              >
                <Background />
                <Controls />
              </ReactFlow>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
