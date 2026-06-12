import { NxGraph } from "./graph.ts";
import { NxSimpleAgent } from "./simple-agent.ts";
import { NxMovementContext } from "./movement-context.ts";
import { NxWitnessedEvent } from "./events.ts";
import { getDefaultRegistry } from "./plugin-registry.ts";
import type { NxPluginRegistry } from "./plugin-registry.ts";
import type { NxLocatable, NxIdentifiable } from "../types.ts";

export class NxWorld {
  graph: NxGraph;
  agents: Map<string, NxSimpleAgent> = new Map();
  entities: Map<string, NxLocatable & NxIdentifiable> = new Map();
  objects: Map<string, NxLocatable & NxIdentifiable> = new Map();
  objectLocation: Map<string, string> = new Map();
  pendingEvents: unknown[] = [];
  spatialIndex: Map<string, Set<string>> = new Map();
  private registry: NxPluginRegistry;

  constructor(graph?: NxGraph, registry?: NxPluginRegistry) {
    this.graph = graph ?? new NxGraph();
    this.registry = registry ?? getDefaultRegistry();
  }

  agentsAtNode(nodeName: string): NxSimpleAgent[] {
    const result: NxSimpleAgent[] = [];
    for (const [, obj] of this.agents) {
      if (obj.location === nodeName) {
        result.push(obj);
      }
    }
    return result;
  }

  entitiesAtNode(nodeName: string): (NxLocatable & NxIdentifiable)[] {
    const result: (NxLocatable & NxIdentifiable)[] = [];
    for (const [, obj] of this.entities) {
      if (this.resolveLocationOf(obj) === nodeName) {
        result.push(obj);
      }
    }
    return result;
  }

  objectsAtNode(nodeName: string): (NxLocatable & NxIdentifiable)[] {
    const ids = this.spatialIndex.get(nodeName);
    if (!ids || ids.size === 0) return [];
    const result: (NxLocatable & NxIdentifiable)[] = [];
    for (const id of ids) {
      const obj = this.objects.get(id);
      if (obj) result.push(obj);
    }
    return result;
  }

  addEntity(obj: NxLocatable & NxIdentifiable): void {
    const id = obj.id;
    this.objects.set(id, obj);
    if (obj instanceof NxSimpleAgent) {
      this.agents.set(id, obj);
    } else {
      this.entities.set(id, obj);
    }
    this.registerObjectLocation(obj);
  }

  removeEntity(obj: NxLocatable & NxIdentifiable): void {
    const id = obj.id;
    this.removeObjectFromIndex(obj);
    this.objects.delete(id);
    this.agents.delete(id);
    this.entities.delete(id);
  }

  registerObjectLocation(obj: NxLocatable & NxIdentifiable): void {
    const location = obj.location;
    if (location) {
      const id = obj.id;
      if (!this.spatialIndex.has(location)) {
        this.spatialIndex.set(location, new Set());
      }
      this.spatialIndex.get(location)!.add(id);
      this.objectLocation.set(id, location);
    }
  }

  resolveLocationOf(obj: NxLocatable): string | undefined {
    return obj.location;
  }

  updateObjectLocation(
    obj: NxLocatable & NxIdentifiable,
    fromNode: string | undefined,
    toNode: string,
  ): void {
    const id = obj.id;

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

  removeObjectFromIndex(obj: NxLocatable & NxIdentifiable): void {
    const id = obj.id;
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

    await this.registry.hooksFor("validate").runWith(ctx);
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
    await this.registry.hooksFor("departure").runWith(ctx);
    await this.registry.hooksFor("hazard").runWith(ctx);

    this.updateObjectLocation(agent, currentLocation, targetNode);
    agent.location = targetNode;

    await this.registry.hooksFor("arrival").runWith(ctx);
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
