import type { PropertyContainer } from "../types.ts";

const RESERVED_PREFIX = "~";

/** A graph node (vertex) in the spatial property graph. */
export class NxNode implements PropertyContainer {
  /** Unique name identifying this node. */
  readonly name: string;
  /** Optional human-readable label. */
  label: string;
  private _properties: Record<string, unknown> | undefined;

  /** Create a node with a name and optional label. */
  constructor(name: string, label?: string) {
    this.name = name;
    this.label = label ?? name;
  }

  /** All custom properties on this node. */
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

  /** Serialize to a plain JSON object with `~id` / `~label` keys. */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      "~id": this.name,
      "~label": this.label,
    };
    if (this._properties) {
      for (const [key, value] of Object.entries(this._properties)) {
        result[key] = value;
      }
    }
    return result;
  }

  /** Deserialize from a plain JSON object. */
  static fromJSON(data: Record<string, unknown>): NxNode {
    const name = data["~id"] as string;
    const label = (data["~label"] as string) ?? name;
    const node = new NxNode(name, label);
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(RESERVED_PREFIX)) {
        node.setProperty(key, value);
      }
    }
    return node;
  }
}
