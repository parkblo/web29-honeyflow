export type Node = {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "head" | "note" | "url" | "image" | "subspace";
};

export type Edge = {
  from: Node;
  to: Node;
};
