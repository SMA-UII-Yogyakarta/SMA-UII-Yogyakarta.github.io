import { visit } from 'unist-util-visit';
import type { Root, Code, Parent, Html } from 'mdast';

export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index: number | undefined, parent: Parent | undefined) => {
      if (node.lang === 'mermaid' && typeof index === 'number' && parent) {
        parent.children[index] = {
          type: 'html',
          value: `<pre class="mermaid">${node.value}</pre>`,
        } as Html;
      }
    });
  };
}
