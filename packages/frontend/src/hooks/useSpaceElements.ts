import { useState } from "react";

import { Vector2d } from "konva/lib/types";
import { Edge, Node } from "shared/types";

type useSpaceElementsParams = {
  initialNodes?: Node[];
  initialEdges?: Edge[];
};

export type spaceActions = {
  createNode: (
    type: Node["type"],
    parentNode: Node,
    position: Vector2d,
    name?: string,
  ) => void;
  createEdge: (fromNode: Node, toNode: Node) => void;
};

export default function useSpaceElements({
  initialNodes = [],
  initialEdges = [],
}: useSpaceElementsParams) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const spaceActions = {
    createNode: (
      type: Node["type"],
      parentNode: Node,
      position: Vector2d,
      name: string = `New ${type}`,
    ) => {
      // FIXME: 서버와 통신하는 부분 연결해서 수정. 낙관적 업데이트 고려 필요.
      const newNode = {
        id: Math.random().toString(36),
        name,
        x: position.x,
        y: position.y,
        type,
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);

      if (parentNode) {
        const newEdge = {
          from: parentNode,
          to: newNode,
        };

        setEdges((prevEdges) => [...prevEdges, newEdge]);
      }
    },
    createEdge: (fromNode: Node, toNode: Node) => {
      // FIXME: 서버와 통신하는 부분 연결해서 수정.
      const newEdge = {
        from: fromNode,
        to: toNode,
      };

      // from-to 순서가 바뀌어도 같은 간선이므로 교차 검사
      const isSameEdgeExist = edges.some(
        (edge) =>
          (edge.from.id === toNode.id && edge.to.id === fromNode.id) ||
          (edge.from.id === fromNode.id && edge.to.id === toNode.id),
      );

      if (isSameEdgeExist) return;

      setEdges((prevEdges) => [...prevEdges, newEdge]);
    },
  };

  return { nodes, edges, spaceActions };
}