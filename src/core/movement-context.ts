import type { NxEdge } from "./edge.ts";
import type { NxWorld } from "./world.ts";
import type { NxLocatable, NxIdentifiable } from "../types.ts";

/** Pipeline execution context capturing entity, target, world, and mutable per-step data. */
export class NxMovementContext {
  entity: NxLocatable & NxIdentifiable;
  targetNode: string;
  world: NxWorld;
  edge: NxEdge | null = null;
  private data = new Map<string, unknown>();

  constructor(
    entity: NxLocatable & NxIdentifiable,
    targetNode: string,
    world: NxWorld,
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
