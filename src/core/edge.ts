import type { EdgeDirection, PropertyContainer } from "../types.ts";

const RESERVED_PREFIX = "~";
const VALID_DIRECTIONS: EdgeDirection[] = ["both", "forward", "backward"];

/** A directed or undirected edge in the spatial property graph, with optional distance/risk. */
export class NxEdge implements PropertyContainer {
  /** First endpoint node name. */
  node1: string;
  /** Second endpoint node name. */
  node2: string;
  /** Traversal cost / distance. */
  distance: number;
  /** Hazard risk factor (0–1). */
  risk: number;
  private _direction: EdgeDirection = "both";
  private _properties: Record<string, unknown> | undefined;

  /** Create an edge between two nodes with optional distance, risk, and direction. */
  constructor(
    node1: string,
    node2: string,
    options?: {
      distance?: number;
      risk?: number;
      direction?: EdgeDirection;
    },
  ) {
    this.node1 = node1;
    this.node2 = node2;
    this.distance = options?.distance ?? 1;
    this.risk = options?.risk ?? 0.0;
    this.direction = options?.direction ?? "both";
  }

  /** Directionality of the edge. */
  get direction(): EdgeDirection {
    return this._direction;
  }

  /** Set directionality, validated against allowed values. */
  set direction(value: EdgeDirection) {
    if (!VALID_DIRECTIONS.includes(value)) {
      throw new Error(
        `Invalid direction "${value}". Must be one of: ${VALID_DIRECTIONS.join(", ")}`,
      );
    }
    this._direction = value;
  }

  /** All custom properties on this edge. */
  get properties(): Record<string, unknown> {
    if (!this._properties) {
      this._properties = {};
    }
    return this._properties;
  }

  /** Get a property by key, returning undefined if absent. */
  getProperty<T = unknown>(key: string): T | undefined;
  /** Get a property by key, returning fallback if absent. */
  getProperty<T = unknown>(key: string, fallback: T): T;
  getProperty<T = unknown>(key: string, fallback?: T): T | undefined {
    if (this._properties && key in this._properties) {
      return this._properties[key] as T;
    }
    return fallback;
  }

  /** Set a property. Throws if key starts with `~`. */
  setProperty(key: string, value: unknown): void {
    if (key.startsWith(RESERVED_PREFIX)) {
      throw new Error(
        `Property key "${key}" starts with reserved prefix "${RESERVED_PREFIX}"`,
      );
    }
    this.properties[key] = value;
  }

  /** Check if a property exists. */
  hasProperty(key: string): boolean {
    return this._properties ? key in this._properties : false;
  }

  /** Remove a property. */
  removeProperty(key: string): void {
    if (this._properties) {
      delete this._properties[key];
    }
  }

  /** Copy of all properties as a plain object. */
  allProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  /** Check if this edge connects to the given node. */
  connectsNode(nodeName: string): boolean {
    return this.node1 === nodeName || this.node2 === nodeName;
  }

  /** Get the opposite endpoint node name. */
  otherEndOf(nodeName: string): string {
    if (this.node1 === nodeName) return this.node2;
    if (this.node2 === nodeName) return this.node1;
    throw new Error(`Edge does not connect node "${nodeName}"`);
  }

  /** Whether traversal from the given node is permitted by direction. */
  allowsTraversalFrom(nodeName: string): boolean {
    if (this.direction === "both") return true;
    if (this.direction === "forward") return this.node1 === nodeName;
    if (this.direction === "backward") return this.node2 === nodeName;
    return false;
  }

  /** Serialize to a plain JSON object with `~`-prefix keys. */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      "~from": this.node1,
      "~to": this.node2,
      "~distance": this.distance,
      "~risk": this.risk,
      "~direction": this.direction,
    };
    if (this._properties) {
      for (const [key, value] of Object.entries(this._properties)) {
        result[key] = value;
      }
    }
    return result;
  }

  /** Deserialize from a plain JSON object. */
  static fromJSON(data: Record<string, unknown>): NxEdge {
    const from = data["~from"] as string;
    const to = data["~to"] as string;
    const edge = new NxEdge(from, to, {
      distance: (data["~distance"] as number) ?? 1,
      risk: (data["~risk"] as number) ?? 0.0,
      direction: (data["~direction"] as EdgeDirection) ?? "both",
    });
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(RESERVED_PREFIX)) {
        edge.setProperty(key, value);
      }
    }
    return edge;
  }
}
