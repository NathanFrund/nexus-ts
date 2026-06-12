import { NxGraph } from "./graph.ts";
import { NxSimpleAgent } from "./simple-agent.ts";
import { NxMovementContext } from "./movement-context.ts";
import { NxWitnessedEvent } from "./events.ts";
import { getDefaultRegistry } from "./plugin-registry.ts";

export class NxWorld {
  graph: NxGraph;
  agents: Map<string, unknown> = new Map();
  entities: Map<string, unknown> = new Map();
  objects: Map<string, unknown> = new Map();
  objectLocation: Map<string, string> = new Map();
  pendingEvents: unknown[] = [];
  spatialIndex: Map<string, Set<string>> = new Map();

  constructor(graph?: NxGraph) {
    this.graph = graph ?? new NxGraph();
  }

  agentsAtNode(nodeName: string): NxSimpleAgent[] {
    const result: NxSimpleAgent[] = [];
    for (const [, obj] of this.agents) {
      if (
        obj instanceof NxSimpleAgent && obj.location === nodeName
      ) {
        result.push(obj);
      }
    }
    return result;
  }

  entitiesAtNode(nodeName: string): unknown[] {
    const result: unknown[] = [];
    for (const [, obj] of this.entities) {
      if (this.resolveLocationOf(obj) === nodeName) {
        result.push(obj);
      }
    }
    return result;
  }

  objectsAtNode(nodeName: string): unknown[] {
    const ids = this.spatialIndex.get(nodeName);
    if (!ids || ids.size === 0) return [];
    const result: unknown[] = [];
    for (const id of ids) {
      const obj = this.objects.get(id);
      if (obj) result.push(obj);
    }
    return result;
  }

  addEntity(obj: unknown): void {
    const id = this.resolveId(obj);
    if (!id) throw new Error("Entity must have an id or be an NxSimpleAgent");
    this.objects.set(id, obj);
    if (obj instanceof NxSimpleAgent) {
      this.agents.set(id, obj);
    } else {
      this.entities.set(id, obj);
    }
    this.registerObjectLocation(obj);
  }

  removeEntity(obj: unknown): void {
    const id = this.resolveId(obj);
    if (!id) return;
    this.removeObjectFromIndex(obj);
    this.objects.delete(id);
    this.agents.delete(id);
    this.entities.delete(id);
  }

  registerObjectLocation(obj: unknown): void {
    const location = this.resolveLocationOf(obj);
    if (location) {
      const id = this.resolveId(obj);
      if (id) {
        if (!this.spatialIndex.has(location)) {
          this.spatialIndex.set(location, new Set());
        }
        this.spatialIndex.get(location)!.add(id);
        this.objectLocation.set(id, location);
      }
    }
  }

  resolveLocationOf(obj: unknown): string | undefined {
    const components = (obj as Record<string, unknown>)["components"];
    if (components instanceof Map) {
      const pos = components.get("NxPosition") as
        | { nodeName?: string }
        | undefined;
      if (pos?.nodeName) return pos.nodeName;
    }
    const location = (obj as Record<string, unknown>)["location"];
    if (typeof location === "string") return location;
    return undefined;
  }

  private resolveId(obj: unknown): string | undefined {
    if (obj instanceof NxSimpleAgent) return obj.id;
    const id = (obj as Record<string, unknown>)["id"];
    if (typeof id === "string") return id;
    return undefined;
  }

  updateObjectLocation(
    obj: unknown,
    fromNode: string | undefined,
    toNode: string,
  ): void {
    const id = this.resolveId(obj);
    if (!id) return;

    if (fromNode) {
      const bucket = this.spatialIndex.get(fromNode);
      if (bucket) {
        bucket.delete(id);
        if (bucket.size === 0) this.spatialIndex.delete(fromNode);
      }
    }

    if (!this.spatialIndex.has(toNode)) {
      this.spatialIndex.set(toNode, new Set());
    }
    this.spatialIndex.get(toNode)!.add(id);
    this.objectLocation.set(id, toNode);
  }

  removeObjectFromIndex(obj: unknown): void {
    const id = this.resolveId(obj);
    if (!id) return;
    const loc = this.objectLocation.get(id);
    if (loc) {
      const bucket = this.spatialIndex.get(loc);
      if (bucket) {
        bucket.delete(id);
        if (bucket.size === 0) this.spatialIndex.delete(loc);
      }
    }
    this.objectLocation.delete(id);
  }

  async moveAgent(
    agent: NxSimpleAgent,
    targetNode: string,
  ): Promise<boolean> {
    const currentLocation = agent.location;
    const edge = this.graph.edgesFrom(currentLocation).find(
      (e) => e.otherEndOf(currentLocation) === targetNode,
    );
    if (!edge) return false;
    if (!edge.allowsTraversalFrom(currentLocation)) return false;

    const ctx = new NxMovementContext(agent, targetNode, this);
    ctx.edge = edge;

    const registry = getDefaultRegistry();
    await registry.hooksFor("validate").runWith(ctx);
    if (!ctx.moveAllowed) return false;

    const witnesses = this.witnessedEventsFor(
      "departure",
      currentLocation,
      agent,
    );
    this.pendingEvents = [];
    for (const w of witnesses) {
      this.pendingEvents.push(w);
    }
    await registry.hooksFor("departure").runWith(ctx);
    await registry.hooksFor("hazard").runWith(ctx);

    this.updateObjectLocation(agent, currentLocation, targetNode);
    agent.location = targetNode;

    await registry.hooksFor("arrival").runWith(ctx);
    return true;
  }

  witnessedEventsFor(
    eventType: string,
    nodeName: string,
    source: unknown,
  ): NxWitnessedEvent[] {
    const observers = this.objectsAtNode(nodeName).filter(
      (o) => o !== source,
    );
    if (observers.length === 0) {
      return [
        new NxWitnessedEvent(eventType, null, source, nodeName),
      ];
    }
    return observers.map(
      (obs) => new NxWitnessedEvent(eventType, obs, source, nodeName),
    );
  }
}
