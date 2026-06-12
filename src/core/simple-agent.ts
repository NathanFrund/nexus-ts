import type { NxLocatable, NxIdentifiable } from "../types.ts";

/** Lightweight spatial agent with a location and identity, no ECS overhead. */
export class NxSimpleAgent implements NxLocatable, NxIdentifiable {
  id: string;
  name: string;
  location: string;

  constructor(id: string, name: string, location: string) {
    this.id = id;
    this.name = name;
    this.location = location;
  }
}
