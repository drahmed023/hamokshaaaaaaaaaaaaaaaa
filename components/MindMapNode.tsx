


import React from 'react';
import { MindMapNodeData } from '../types';

type MindMapNodeProps = {
  node: MindMapNodeData;
};

function MindMapNode({ node }: MindMapNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <div className="p-3 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg inline-block shadow-sm">
        {node.topic}
      </div>
      {hasChildren && (
        <ul className="ps-8 border-s-2 border-slate-300 dark:border-slate-600 ms-4">
          {node.children!.map((child, index) => (
            // FIX: Added key prop to the wrapping li to resolve list rendering error.
            <li className="my-2" key={index}>
                <MindMapNode node={child} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default MindMapNode;