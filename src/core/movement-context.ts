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
  /** Previous node name before the move (set by departure step). */
  previousNode: string | undefined;
  private _moveAllowed = true;
  private pluginData = new Map<string, unknown>();

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
    return this._moveAllowed;
  }

  /** Veto the move. Once set to false, stays false (one-way latch). */
  set moveAllowed(value: boolean) {
    this._moveAllowed = this._moveAllowed && value;
  }

  /** Read plugin-scoped data by key. */
  getPluginData<T = unknown>(key: string): T | undefined;
  /** Read plugin-scoped data with fallback. */
  getPluginData<T = unknown>(key: string, fallback: T): T;
  getPluginData<T = unknown>(key: string, fallback?: T): T | undefined {
    if (this.pluginData.has(key)) {
      return this.pluginData.get(key) as T;
    }
    return fallback;
  }

  /** Store plugin-scoped data for cross-hook communication. */
  setPluginData(key: string, value: unknown): void {
    this.pluginData.set(key, value);
  }
}
