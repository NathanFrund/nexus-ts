import type { NxEdge } from "./edge.ts";
import type { NxWorld } from "./world.ts";
import type { NxLocatable, NxIdentifiable } from "../types.ts";

/** Pipeline execution context capturing entity, target, world, and mutable per-step data. */
export class NxMovementContext {
  /** The entity being moved. */
  entity: NxLocatable & NxIdentifiable;
  /** The destination node name. */
  targetNode: string;
  /** The world the entity lives in. */
  world: NxWorld;
  /** The edge being traversed, if known. */
  edge: NxEdge | null = null;
  private data = new Map<string, unknown>();

  /** Create a movement context for an entity moving to targetNode within world. */
  constructor(
    entity: NxLocatable & NxIdentifiable,
    targetNode: string,
    world: NxWorld,
  ) {
    this.entity = entity;
    this.targetNode = targetNode;
    this.world = world;
  }

  /** Whether the move is still allowed (one-way veto latch, default true). */
  get moveAllowed(): boolean {
    return (this.data.get("moveAllowed") as boolean) ?? true;
  }

  /** Veto the move. Once set to false, stays false (one-way latch). */
  set moveAllowed(value: boolean) {
    this.data.set("moveAllowed", this.moveAllowed && value);
  }

  /** Read custom per-step data by key. */
  getData<T = unknown>(key: string): T | undefined;
  /** Read custom per-step data with fallback. */
  getData<T = unknown>(key: string, fallback: T): T;
  getData<T = unknown>(key: string, fallback?: T): T | undefined {
    if (this.data.has(key)) {
      return this.data.get(key) as T;
    }
    return fallback;
  }

  /** Store custom per-step data. */
  setData(key: string, value: unknown): void {
    this.data.set(key, value);
  }
}
