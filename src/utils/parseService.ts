import type { Node, Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { getLayoutedElements } from './layout';

interface ServiceNode {
  uuid?: string;
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
  childrenMap: Record<string, { nodes: Node[]; edges: Edge[]; rawData: ServiceNode[] }[]>;
}

export function parseServiceDAG(data: ServiceNode[]): ParsedDAG {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const childrenMap: Record<string, { nodes: Node[]; edges: Edge[]; rawData: ServiceNode[] }[]> = {};

  const nameToUUIDMap = new Map<string, string>();

  // Step 1: Assign UUIDs to root nodes and create basic node
  data.forEach((node) => {
    const nodeId = uuidv4();
    node.uuid = nodeId;
    nameToUUIDMap.set(node.name, nodeId);

    nodes.push({
      id: nodeId,
      data: { label: node.name, children: [] }, // initialize empty children array
      position: { x: 0, y: 0 },
    });
  });

  // Step 2: Create edges for root nodes and process children
  data.forEach((node, idx) => {
    // Root edges
    if (node.output && nameToUUIDMap.has(node.output)) {
      edges.push({
        id: `e-${node.uuid}-${nameToUUIDMap.get(node.output)}`,
        source: node.uuid!,
        target: nameToUUIDMap.get(node.output)!,
      });
    }

    // Children
    if (node.children && node.children.length > 0) {
      childrenMap[node.uuid!] = [];

      node.children.forEach((group) => {
        const childNodes: Node[] = [];
        const childEdges: Edge[] = [];

        // Assign UUIDs
        group.childs.forEach((childNode) => {
          childNode.uuid = uuidv4();
        });

        // Map input to UUIDs
        group.childs.forEach((childNode, idx) => {
          if (childNode.input) {
            for (let i = idx - 1; i >= 0; i--) {
              if (group.childs[i].name === childNode.input) {
                childNode.input = group.childs[i].uuid!;
                break;
              }
            }
          }
        });

        // Create child nodes and edges
        group.childs.forEach((childNode) => {
          childNodes.push({
            id: childNode.uuid!,
            data: { label: childNode.name },
            position: { x: 0, y: 0 },
          });

          if (childNode.input) {
            childEdges.push({
              id: `e-${childNode.uuid}-${childNode.input}`,
              source: childNode.input,
              target: childNode.uuid!,
            });
          }
        });
// **Call getLayoutedElements here**
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    childNodes,
    childEdges
  );

  const childGroupData = {
    nodes: layoutedNodes,
    edges: layoutedEdges,
    rawData: group.childs,
  };
        childrenMap[node.uuid!].push(childGroupData);

        // Also attach to node.data.children so ReactFlow can use it directly
        const rootNode = nodes.find((n) => n.id === node.uuid);
        if (rootNode) {
          rootNode.data.children!.push(childGroupData);
        }
      });
    }
  });

  return { nodes, edges, childrenMap };
}
