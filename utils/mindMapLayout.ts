import { MindMapNodeData } from '../types';

export interface LayoutNode extends MindMapNodeData {
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
  parent?: LayoutNode;
}

export interface LayoutLink {
  source: LayoutNode;
  target: LayoutNode;
}

// A very simplified layout algorithm
export const createMindMapLayout = (root: MindMapNodeData, nodeWidth: number, nodeHeight: number, xSeparation: number, ySeparation: number) => {
  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];
  
  let maxDepth = 0;

  function firstWalk(node: LayoutNode, depth = 0) {
    if (depth > maxDepth) maxDepth = depth;
    nodes.push(node);

    if (node.children.length === 0) {
      node.y = depth * (nodeHeight + ySeparation);
      return;
    }

    node.children.forEach(child => {
      child.parent = node;
      firstWalk(child, depth + 1);
      if (node.parent) {
         links.push({ source: node, target: child });
      }
    });
  }

  // This is a naive implementation for positioning, not a proper tree algorithm like Buchheim.
  // It positions nodes based on their depth and breadth within that depth.
  function secondWalk(rootNode: LayoutNode) {
    const nodesByDepth: { [key: number]: LayoutNode[] } = {};
    nodes.forEach(n => {
        const depth = getDepth(n);
        if(!nodesByDepth[depth]) nodesByDepth[depth] = [];
        nodesByDepth[depth].push(n);
    });

    for(let depth = 0; depth <= maxDepth; depth++) {
        const levelNodes = nodesByDepth[depth];
        const levelWidth = levelNodes.length * (nodeWidth + xSeparation);
        levelNodes.forEach((node, i) => {
            node.x = -levelWidth / 2 + i * (nodeWidth + xSeparation) + nodeWidth / 2;
        });
    }
    
    // Position root at 0,0
    const rootXOffset = rootNode.x;
    const rootYOffset = rootNode.y;
    nodes.forEach(node => {
        node.x -= rootXOffset;
        node.y -= rootYOffset;
    });
  }

  function getDepth(node: LayoutNode): number {
    let depth = 0;
    let current = node;
    while(current.parent) {
        depth++;
        current = current.parent;
    }
    return depth;
  }
  
  const layoutRoot: LayoutNode = {
    ...root,
    x: 0,
    y: 0,
    width: nodeWidth,
    height: nodeHeight,
    children: root.children ? root.children.map(c => convertToLayoutNode(c, nodeWidth, nodeHeight)) : [],
  };

  firstWalk(layoutRoot);
  secondWalk(layoutRoot);
  
  // Create links for the root's children explicitly
  layoutRoot.children.forEach(child => {
      links.push({ source: layoutRoot, target: child });
  });

  return { nodes, links };
};

function convertToLayoutNode(nodeData: MindMapNodeData, width: number, height: number): LayoutNode {
    const node: LayoutNode = {
        ...nodeData,
        x: 0,
        y: 0,
        width,
        height,
        children: []
    };
    if (nodeData.children) {
        node.children = nodeData.children.map(c => convertToLayoutNode(c, width, height));
    }
    return node;
}
