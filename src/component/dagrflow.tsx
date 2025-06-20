import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElements } from '../utils/layout';
import { parseServiceDAG } from '../utils/parseService';
import sampleData from '../data/sample.json'; // move your JSON into this file

export default function DAGFlow() {
  const parsed = useMemo(() => parseServiceDAG(sampleData), []);
type SelectedChildDAG = {
  nodes: Node[];
  edges: Edge[];
};

const [selectedChildren, setSelectedChildren] = useState<SelectedChildDAG[]>([]);
const [activeParentNode, setActiveParentNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => getLayoutedElements(parsed.nodes, parsed.edges), [parsed]);

  // On click on element if leement has childs display them
  const handleNodeClick = (_: unknown, node: Node) => {
    // hide existing child graphs
    if (activeParentNode === node.id) {
          setSelectedChildren([]);
          setActiveParentNode(null);
          return;
        }


    const childGroups = parsed.childrenMap[node.id];
    if (childGroups) {
      const groupDAGs =  childGroups.map((group, groupIndex) => {
        const gNodes: Node[] = [];
        const gEdges: Edge[] = [];

        group.childs.forEach((child) => {
          gNodes.push({
            id: `${node.id}-${groupIndex}-${child.name}`,
            data: { label: child.name },
            position: { x: 0, y: 0 },
          });

          if (child.output) {
            gEdges.push({
              id: `e-${child.name}-${child.output}`,
              source: `${node.id}-${groupIndex}-${child.name}`,
              target: `${node.id}-${groupIndex}-${child.output}`,
            });
          }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(gNodes, gEdges);
        return { nodes: layoutedNodes, edges: layoutedEdges };
      });

      setSelectedChildren(groupDAGs);
    } else {
      setSelectedChildren([]);
    }
  };

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
              <ReactFlow nodes={group.nodes} edges={group.edges} fitView>
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
