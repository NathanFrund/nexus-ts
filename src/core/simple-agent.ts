import type { NxLocatable, NxIdentifiable } from "../types.ts";

/** Lightweight spatial agent with a location and identity, no ECS overhead. */
export class NxSimpleAgent implements NxLocatable, NxIdentifiable {
  /** Unique identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Current graph node name. */
  location: string;

  /** Create a simple agent with an id, name, and starting location. */
  constructor(id: string, name: string, location: string) {
    this.id = id;
    this.name = name;
    this.location = location;
  }
}
