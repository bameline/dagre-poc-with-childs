import type { Node, Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

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

  // Step 1: Assign UUIDs to root nodes
  data.forEach((node) => {
    const nodeId = uuidv4();
    node.uuid = nodeId;
    nameToUUIDMap.set(node.name, nodeId);

    nodes.push({
      id: nodeId,
      data: { label: node.name },
      position: { x: 0, y: 0 },
    });
  });

  // Step 2: Create edges for root nodes
  data.forEach((node) => {
    if (node.output && nameToUUIDMap.has(node.output)) {
      edges.push({
        id: `e-${node.uuid}-${nameToUUIDMap.get(node.output)}`,
        source: node.uuid!,
        target: nameToUUIDMap.get(node.output)!,
      });
    }

    // Step 3: Process children
    if (node.children) {
      childrenMap[node.uuid!] = [];

      node.children.forEach((group) => {
        const childNodes: Node[] = [];
        const childEdges: Edge[] = [];

        // Assign UUIDs to all child nodes first
        group.childs.forEach((childNode) => {
          childNode.uuid = uuidv4();
        });

        // Build a mapping from (name + occurrence) to UUID to handle duplicates correctly
        const occurrenceMap = new Map<string, ServiceNode[]>();
        group.childs.forEach((childNode) => {
          if (!occurrenceMap.has(childNode.name)) {
            occurrenceMap.set(childNode.name, []);
          }
          occurrenceMap.get(childNode.name)!.push(childNode);
        });

        // Reassign input using the closest previous sibling that matches the input name
        group.childs.forEach((childNode, idx) => {
          if (childNode.input) {
            // Look backwards to find the closest previous node with the same name as the input
            for (let i = idx - 1; i >= 0; i--) {
              if (group.childs[i].name === childNode.input) {
                childNode.input = group.childs[i].uuid!;
                break; // Stop at the closest one
              }
            }
          }
        });

         /* if (childNode.output) {
            const outputNode = occurrenceMap.get(childNode.output)?.find(
              (n) => n.uuid !== childNode.uuid
            );
            if (outputNode) {
              childNode.output = outputNode.uuid!;
            }
          }*/

        // Create nodes and edges
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

        // Save processed child group
        childrenMap[node.uuid!].push({
          nodes: childNodes,
          edges: childEdges,
          rawData: group.childs, // Keep the original data if needed
        });
      });
    }
  });
  console.log(nodes)
  console.log(childrenMap)
  return { nodes, edges, childrenMap };
}
