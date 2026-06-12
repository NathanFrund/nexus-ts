import type { EdgeDirection, PropertyContainer } from "../types.ts";

const RESERVED_PREFIX = "~";
const VALID_DIRECTIONS: EdgeDirection[] = ["both", "forward", "backward"];

export class NxEdge implements PropertyContainer {
  node1: string;
  node2: string;
  distance: number;
  risk: number;
  private _direction: EdgeDirection = "both";
  private _properties: Record<string, unknown> | undefined;

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

  get direction(): EdgeDirection {
    return this._direction;
  }

  set direction(value: EdgeDirection) {
    if (!VALID_DIRECTIONS.includes(value)) {
      throw new Error(
        `Invalid direction "${value}". Must be one of: ${VALID_DIRECTIONS.join(", ")}`,
      );
    }
    this._direction = value;
  }

  get properties(): Record<string, unknown> {
    if (!this._properties) {
      this._properties = {};
    }
    return this._properties;
  }

  getProperty<T = unknown>(key: string): T | undefined;
  getProperty<T = unknown>(key: string, fallback: T): T;
  getProperty<T = unknown>(key: string, fallback?: T): T | undefined {
    if (this._properties && key in this._properties) {
      return this._properties[key] as T;
    }
    return fallback;
  }

  setProperty(key: string, value: unknown): void {
    if (key.startsWith(RESERVED_PREFIX)) {
      throw new Error(
        `Property key "${key}" starts with reserved prefix "${RESERVED_PREFIX}"`,
      );
    }
    this.properties[key] = value;
  }

  hasProperty(key: string): boolean {
    return this._properties ? key in this._properties : false;
  }

  removeProperty(key: string): void {
    if (this._properties) {
      delete this._properties[key];
    }
  }

  allProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  connectsNode(nodeName: string): boolean {
    return this.node1 === nodeName || this.node2 === nodeName;
  }

  otherEndOf(nodeName: string): string {
    if (this.node1 === nodeName) return this.node2;
    if (this.node2 === nodeName) return this.node1;
    throw new Error(`Edge does not connect node "${nodeName}"`);
  }

  allowsTraversalFrom(nodeName: string): boolean {
    if (this.direction === "both") return true;
    if (this.direction === "forward") return this.node1 === nodeName;
    if (this.direction === "backward") return this.node2 === nodeName;
    return false;
  }

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
