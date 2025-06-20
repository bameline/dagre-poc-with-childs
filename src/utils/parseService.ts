import type { Node, Edge } from 'reactflow';

interface ServiceNode {
  name: string;
  input: string | null;
  output: string | null;
  children?: ChildGroup[];
}

interface ChildGroup {
  idStuff: string;
  AnotherIdStuff: string;
  childs: ServiceNode[];
}

export interface ParsedDAG {
  nodes: Node[];
  edges: Edge[];
  childrenMap: Record<string, ChildGroup[]>; // Keyed by parent service name
}

export function parseServiceDAG(data: ServiceNode[]): ParsedDAG {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const childrenMap: Record<string, ChildGroup[]> = {};

  data.forEach((jsonEntry) => {
    // Root-level node
    nodes.push({
      id: jsonEntry.name,
      data: { label: jsonEntry.name },
      position: { x: 0, y: 0 },
    });

    if (jsonEntry.output) {
      edges.push({
        id: `e-${jsonEntry.name}-${jsonEntry.output}`,
        source: jsonEntry.name,
        target: jsonEntry.output,
      });
    }

    // Map children if they exist
    if (jsonEntry.children) {
      childrenMap[jsonEntry.name] = jsonEntry.children;
    }
  });

  return { nodes, edges, childrenMap };
}
