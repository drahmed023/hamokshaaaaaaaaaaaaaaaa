import React from 'react';
import { MindMapNodeData } from '../types';

type MindMapNodeProps = {
  node: MindMapNodeData;
};

const MindMapNode: React.FC<MindMapNodeProps> = ({ node }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className="my-2">
      <div className="p-3 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg inline-block shadow-sm">
        {node.topic}
      </div>
      {hasChildren && (
        <ul className="ps-8 border-s-2 border-slate-300 dark:border-slate-600 ms-4">
          {node.children!.map((child, index) => (
            <MindMapNode key={index} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default MindMapNode;