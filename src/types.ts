/** Directionality of an edge for traversal permission. */
export type EdgeDirection = "both" | "forward" | "backward";

/** Entity that occupies a location in the spatial graph. */
export interface NxLocatable {
  /** The name of the graph node this entity is at. */
  location?: string;
}

/** Entity with a unique string identifier. */
export interface NxIdentifiable {
  /** Unique identifier for this entity. */
  id: string;
}

/** Name of a hook in the movement pipeline. */
export type NxHookName =
  | "validate"
  | "departure"
  | "hazard"
  | "spatialMove"
  | "arrival"
  | "announce";

/** All six hook names in pipeline execution order. */
export const ALL_HOOKS: NxHookName[] = [
  "validate",
  "departure",
  "hazard",
  "spatialMove",
  "arrival",
  "announce",
];

/** Key-value property bag with reserved-key guard for `~`-prefixed keys. */
export interface PropertyContainer {
  /** Get a property by key, returning undefined if absent. */
  getProperty<T = unknown>(key: string): T | undefined;
  /** Get a property by key, returning fallback if absent. */
  getProperty<T = unknown>(key: string, fallback: T): T;
  /** Set a property. Throws if key starts with `~`. */
  setProperty(key: string, value: unknown): void;
  /** Check if a property exists. */
  hasProperty(key: string): boolean;
  /** Remove a property. */
  removeProperty(key: string): void;
  /** Copy of all properties as a plain object. */
  allProperties(): Record<string, unknown>;
}

/** Serialized node shape with SurrealDB-friendly `~id`/`~label` keys. */
export interface SerializedNode {
  /** Unique node identifier. */
  "~id": string;
  /** Optional human-readable label. */
  "~label"?: string;
  [key: string]: unknown;
}

/** Serialized edge shape with SurrealDB-friendly `~from`/`~to`/etc. keys. */
export interface SerializedEdge {
  /** Source node name. */
  "~from": string;
  /** Target node name. */
  "~to": string;
  /** Optional traversal distance. */
  "~distance"?: number;
  /** Optional hazard risk 0-1. */
  "~risk"?: number;
  /** Optional directionality. */
  "~direction"?: EdgeDirection;
  [key: string]: unknown;
}

/** Serialized single-graph format for JSON round-trip. */
export interface SerializedGraph {
  /** Map of node names to their metadata. */
  nodes: Record<string, { label?: string; properties?: Record<string, unknown> }>;
  /** Array of edge descriptors. */
  edges: {
    from: string;
    to: string;
    distance?: number;
    risk?: number;
    direction?: EdgeDirection;
  }[];
}

/** Multi-graph hypergraph world format for `NxGraph.loadWorld()`. */
export interface HypergraphWorld {
  /** Map of graph names to their serialized graphs. */
  graphs: Record<string, SerializedGraph>;
}
