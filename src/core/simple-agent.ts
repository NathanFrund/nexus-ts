import type { NxLocatable, NxIdentifiable } from "../types.ts";

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
