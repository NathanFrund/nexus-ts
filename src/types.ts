export type EdgeDirection = "both" | "forward" | "backward";

export type NxHookName =
  | "validate"
  | "departure"
  | "hazard"
  | "spatialMove"
  | "arrival"
  | "announce";

export const ALL_HOOKS: NxHookName[] = [
  "validate",
  "departure",
  "hazard",
  "spatialMove",
  "arrival",
  "announce",
];

export interface PropertyContainer {
  getProperty<T = unknown>(key: string): T | undefined;
  getProperty<T = unknown>(key: string, fallback: T): T;
  setProperty(key: string, value: unknown): void;
  hasProperty(key: string): boolean;
  removeProperty(key: string): void;
  allProperties(): Record<string, unknown>;
}

export interface SerializedNode {
  "~id": string;
  "~label"?: string;
  [key: string]: unknown;
}

export interface SerializedEdge {
  "~from": string;
  "~to": string;
  "~distance"?: number;
  "~risk"?: number;
  "~direction"?: EdgeDirection;
  [key: string]: unknown;
}

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

export interface HypergraphWorld {
  graphs: Record<string, SerializedGraph>;
}
