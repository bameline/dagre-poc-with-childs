import dagre from 'dagre';
import { type Node, type Edge, Position } from 'reactflow';

const nodeWidth = 172;
const nodeHeight = 36;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'BT' | 'LR' | 'RL' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph(); // Create a fresh graph every time
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  // Add nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(dagreGraph);

  // Map positions back to nodes
  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 }, // center nodes
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}
