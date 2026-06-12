import type { NxGraph } from "../core/graph.ts";

/** Spatial position component — attaches an entity to a graph node and provides reachable-nodes query. */
export class NxPosition {
  nodeName: string;
  graph: NxGraph;

  constructor(nodeName: string, graph: NxGraph) {
    this.nodeName = nodeName;
    this.graph = graph;
  }

  get canReachNodes(): string[] {
    return this.graph.edgesFrom(this.nodeName)
      .filter((e) => e.allowsTraversalFrom(this.nodeName))
      .map((e) => e.otherEndOf(this.nodeName));
  }
}

/** Identity component — pairs an id with a human-readable name. */
export class NxIdentity {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
