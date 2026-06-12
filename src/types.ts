/** Directionality of an edge for traversal permission. */
export type EdgeDirection = "both" | "forward" | "backward";

/** Entity that occupies a location in the spatial graph. */
export interface NxLocatable {
  location?: string;
}

/** Entity with a unique string identifier. */
export interface NxIdentifiable {
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
  getProperty<T = unknown>(key: string): T | undefined;
  getProperty<T = unknown>(key: string, fallback: T): T;
  setProperty(key: string, value: unknown): void;
  hasProperty(key: string): boolean;
  removeProperty(key: string): void;
  allProperties(): Record<string, unknown>;
}

/** Serialized node shape with SurrealDB-friendly `~id`/`~label` keys. */
export interface SerializedNode {
  "~id": string;
  "~label"?: string;
  [key: string]: unknown;
}

/** Serialized edge shape with SurrealDB-friendly `~from`/`~to`/etc. keys. */
export interface SerializedEdge {
  "~from": string;
  "~to": string;
  "~distance"?: number;
  "~risk"?: number;
  "~direction"?: EdgeDirection;
  [key: string]: unknown;
}

/** Serialized single-graph format for JSON round-trip. */
export interface SerializedGraph {
  nodes: Record<string, { label?: string; properties?: Record<string, unknown> }>;
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
  graphs: Record<string, SerializedGraph>;
}
