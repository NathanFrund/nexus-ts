import type { PropertyContainer } from "../types.ts";

const RESERVED_PREFIX = "~";

export class NxNode implements PropertyContainer {
  readonly name: string;
  label: string;
  private _properties: Record<string, unknown> | undefined;

  constructor(name: string, label?: string) {
    this.name = name;
    this.label = label ?? name;
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
