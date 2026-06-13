import type { NxGraph } from "../core/graph.ts";

/** Spatial position component — attaches an entity to a graph node and provides reachable-nodes query. */
export class NxPosition {
  /** The node this entity is positioned at. */
  nodeName: string;
  /** The graph to query reachable nodes from. */
  graph: NxGraph;

  /** Attach to a node within a graph. */
  constructor(nodeName: string, graph: NxGraph) {
    this.nodeName = nodeName;
    this.graph = graph;
  }

  /** All nodes reachable from the current position via traversable edges. */
  get canReachNodes(): string[] {
    return this.graph.edgesFrom(this.nodeName)
      .filter((e) => e.allowsTraversalFrom(this.nodeName))
      .map((e) => e.otherEndOf(this.nodeName));
  }
}

/** Identity component — pairs an id with a human-readable name. */
export class NxIdentity {
  /** Unique identifier. */
  id: string;
  /** Human-readable name. */
  name: string;

  /** Create an identity component. */
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
