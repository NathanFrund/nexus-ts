import type { NxWorld } from "../core/world.ts";
import { NxMovementContext } from "../core/movement-context.ts";
import { NxPluginRegistry } from "../core/plugin-registry.ts";
import type { NxLocatable, NxIdentifiable } from "../types.ts";
import { EventEmitter } from "../event-emitter.ts";
import type { EventBus } from "../event-emitter.ts";
import { NxWitnessSystem } from "./witness-system.ts";
import { NxPosition } from "./components.ts";
import { NxEntity } from "./entity.ts";
import type { NxEntityMoved } from "./announcements.ts";

function getPosition(entity: unknown): NxPosition | undefined {
  if (entity instanceof NxEntity) {
    return entity.componentOfType(NxPosition);
  }
  return undefined;
}

/** Six-step async movement pipeline: validate → depart → hazard → move → arrive → announce. */
export class NxMovementSystem {
  /** Witness system for departure/arrival events. */
  witnessSystem: NxWitnessSystem;
  /** Event bus for entity-moved announcements. */
  announcer: EventBus<{
    entityMoved: NxEntityMoved;
  }>;
  private registry: NxPluginRegistry;
  private steps: Array<
    (ctx: NxMovementContext) => Promise<boolean>
  >;

  /** Create a movement system with optional witness system, event bus, and plugin registry. */
  constructor(
    witnessSystem?: NxWitnessSystem,
    eventBus?: EventBus<{ entityMoved: NxEntityMoved }>,
    registry?: NxPluginRegistry,
  ) {
    this.witnessSystem = witnessSystem ?? new NxWitnessSystem();
    this.announcer = eventBus ?? new EventEmitter<{ entityMoved: NxEntityMoved }>();
    this.registry = registry ?? new NxPluginRegistry();
    this.steps = [
      this.stepValidate.bind(this),
      this.stepDeparture.bind(this),
      this.stepHazard.bind(this),
      this.stepSpatialMove.bind(this),
      this.stepArrival.bind(this),
      this.stepAnnounce.bind(this),
    ];
  }

  /** Move an entity to a target node through the full 6-step pipeline. Returns false if vetoed. */
  async moveEntity(
    entity: NxLocatable & NxIdentifiable,
    targetNode: string,
    world: NxWorld,
  ): Promise<boolean> {
    const ctx = new NxMovementContext(entity, targetNode, world);
    const pos = getPosition(entity);
    if (pos) {
      const current = pos.nodeName;
      const edge = world.graph.edgesFrom(current).find(
        (e) => e.otherEndOf(current) === targetNode,
      );
      if (edge) {
        ctx.edge = edge;
      }
    }
    return await this.executePipeline(ctx);
  }

  private async executePipeline(
    ctx: NxMovementContext,
  ): Promise<boolean> {
    for (const step of this.steps) {
      const ok = await step(ctx);
      if (!ok) return false;
    }
    return true;
  }

  private async stepValidate(ctx: NxMovementContext): Promise<boolean> {
    const pos = getPosition(ctx.entity);
    if (!pos) return false;
    const current = pos.nodeName;

    if (!ctx.edge) {
      return false;
    }
    if (!ctx.edge.allowsTraversalFrom(current)) return false;

    await this.registry.hooksFor("validate").runWith(ctx);
    return ctx.moveAllowed;
  }

  private async stepDeparture(ctx: NxMovementContext): Promise<boolean> {
    const pos = getPosition(ctx.entity);
    if (!pos) return false;
    const current = pos.nodeName;

    ctx.previousNode = current;
    await this.registry.hooksFor("departure").runWith(ctx);
    await this.witnessSystem.departEntity(
      ctx.entity,
      current,
      ctx.world,
    );
    return true;
  }

  private async stepHazard(ctx: NxMovementContext): Promise<boolean> {
    await this.registry.hooksFor("hazard").runWith(ctx);
    return true;
  }

  private async stepSpatialMove(
    ctx: NxMovementContext,
  ): Promise<boolean> {
    const pos = getPosition(ctx.entity);
    if (!pos) return false;
    const current = pos.nodeName;

    ctx.world.updateObjectLocation(ctx.entity, current, ctx.targetNode);
    pos.nodeName = ctx.targetNode;

    await this.registry.hooksFor("spatialMove").runWith(ctx);
    return true;
  }

  private async stepArrival(ctx: NxMovementContext): Promise<boolean> {
    await this.witnessSystem.arriveEntity(
      ctx.entity,
      ctx.targetNode,
      ctx.world,
    );
    await this.registry.hooksFor("arrival").runWith(ctx);
    return true;
  }

  private async stepAnnounce(ctx: NxMovementContext): Promise<boolean> {
    await this.announcer.emit("entityMoved", {
      entity: ctx.entity,
      targetNode: ctx.targetNode,
    });
    await this.registry.hooksFor("announce").runWith(ctx);
    return true;
  }

  /** Register a listener for entity-moved events. */
  whenEntityMovedDo(
    listener: (event: NxEntityMoved) => void | Promise<void>,
  ): void {
    this.announcer.on("entityMoved", listener);
  }
}
