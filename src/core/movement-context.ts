import type { NxEdge } from "./edge.ts";
import type { NxGraph } from "./graph.ts";

export interface HasLocation {
  location?: string;
  id?: string;
}

export class NxMovementContext {
  entity: unknown;
  targetNode: string;
  world: { graph: NxGraph };
  edge: NxEdge | null = null;
  private data = new Map<string, unknown>();

  constructor(
    entity: unknown,
    targetNode: string,
    world: { graph: NxGraph },
  ) {
    this.entity = entity;
    this.targetNode = targetNode;
    this.world = world;
  }

  get moveAllowed(): boolean {
    return (this.data.get("moveAllowed") as boolean) ?? true;
  }

  set moveAllowed(value: boolean) {
    this.data.set("moveAllowed", this.moveAllowed && value);
  }

  getData<T = unknown>(key: string): T | undefined;
  getData<T = unknown>(key: string, fallback: T): T;
  getData<T = unknown>(key: string, fallback?: T): T | undefined {
    if (this.data.has(key)) {
      return this.data.get(key) as T;
    }
    return fallback;
  }

  setData(key: string, value: unknown): void {
    this.data.set(key, value);
  }
}
