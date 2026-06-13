import { NxGraph } from "./graph.ts";
import { NxSimpleAgent } from "./simple-agent.ts";
import { NxMovementContext } from "./movement-context.ts";
import { NxWitnessedEvent } from "./events.ts";
import { getDefaultRegistry } from "./plugin-registry.ts";
import type { NxPluginRegistry } from "./plugin-registry.ts";
import type { NxLocatable, NxIdentifiable } from "../types.ts";

/** The spatial world — owns a graph, tracks object locations, and manages pending witnessed events. */
export class NxWorld {
  /** The spatial graph. */
  graph: NxGraph;
  /** Map of agent id to NxSimpleAgent. */
  agents: Map<string, NxSimpleAgent> = new Map();
  /** Map of entity id to non-agent entities. */
  entities: Map<string, NxLocatable & NxIdentifiable> = new Map();
  /** All entities (agents + non-agents) keyed by id. */
  objects: Map<string, NxLocatable & NxIdentifiable> = new Map();
  /** Location cache: entity id → node name. */
  objectLocation: Map<string, string> = new Map();
  /** Queue of witnessed events from recent movements. */
  pendingEvents: unknown[] = [];
  /** Node name → Set of entity ids at that node. */
  spatialIndex: Map<string, Set<string>> = new Map();
  private registry: NxPluginRegistry;

  /** Create a world with an optional graph and plugin registry. */
  constructor(graph?: NxGraph, registry?: NxPluginRegistry) {
    this.graph = graph ?? new NxGraph();
    this.registry = registry ?? getDefaultRegistry();
  }

  /** All simple agents currently at the given node. */
  agentsAtNode(nodeName: string): NxSimpleAgent[] {
    const result: NxSimpleAgent[] = [];
    for (const [, obj] of this.agents) {
      if (obj.location === nodeName) {
        result.push(obj);
      }
    }
    return result;
  }

  /** All non-agent entities currently at the given node. */
  entitiesAtNode(nodeName: string): (NxLocatable & NxIdentifiable)[] {
    const result: (NxLocatable & NxIdentifiable)[] = [];
    for (const [, obj] of this.entities) {
      if (this.resolveLocationOf(obj) === nodeName) {
        result.push(obj);
      }
    }
    return result;
  }

  /** All entities (agents + non-agents) at the given node. */
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

  /** Register an entity/agent in the world and index its location. */
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

  /** Remove an entity/agent from the world. */
  removeEntity(obj: NxLocatable & NxIdentifiable): void {
    const id = obj.id;
    this.removeObjectFromIndex(obj);
    this.objects.delete(id);
    this.agents.delete(id);
    this.entities.delete(id);
  }

  /** Add an entity to the spatial index at its current location. */
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

  /** Read the current node name of a locatable object. */
  resolveLocationOf(obj: NxLocatable): string | undefined {
    return obj.location;
  }

  /** Move an entity from one node to another in the spatial index. */
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

  /** Remove an entity from the spatial index entirely. */
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

  /** Move a simple agent to a target node via the inlined pipeline. */
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

  /** Generate witnessed events for observers at a given node. */
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
