import type { NxWorld } from "../core/world.ts";
import { NxMovementContext } from "../core/movement-context.ts";
import { getDefaultRegistry } from "../core/plugin-registry.ts";
import { EventEmitter } from "../event-emitter.ts";
import { NxWitnessSystem } from "./witness-system.ts";
import { NxPosition } from "./components.ts";
import { NxEntity } from "./entity.ts";
import type { NxEntityMoved } from "./announcements.ts";

function getPosition(entity: unknown): NxPosition | undefined {
  if (entity instanceof NxEntity) {
    return entity.componentOfType(NxPosition);
  }
  const pos = (entity as Record<string, unknown>)["position"];
  if (pos instanceof NxPosition) return pos;
  return undefined;
}

export class NxMovementSystem {
  witnessSystem: NxWitnessSystem = new NxWitnessSystem();
  announcer: EventEmitter<{
    entityMoved: NxEntityMoved;
  }> = new EventEmitter();
  private steps: Array<
    (ctx: NxMovementContext) => Promise<boolean>
  >;

  constructor() {
    this.steps = [
      this.stepValidate.bind(this),
      this.stepDeparture.bind(this),
      this.stepHazard.bind(this),
      this.stepSpatialMove.bind(this),
      this.stepArrival.bind(this),
      this.stepAnnounce.bind(this),
    ];
  }

  async moveEntity(
    entity: unknown,
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

    ctx.setData("moveAllowed", true);
    const registry = getDefaultRegistry();
    await registry.hooksFor("validate").runWith(ctx);
    return ctx.moveAllowed;
  }

  private async stepDeparture(ctx: NxMovementContext): Promise<boolean> {
    const pos = getPosition(ctx.entity);
    if (!pos) return false;
    const current = pos.nodeName;

    ctx.setData("previousNode", current);
    const registry = getDefaultRegistry();
    await registry.hooksFor("departure").runWith(ctx);
    this.witnessSystem.departEntity(
      ctx.entity,
      current,
      ctx.world as unknown as NxWorld,
    );
    return true;
  }

  private async stepHazard(ctx: NxMovementContext): Promise<boolean> {
    const registry = getDefaultRegistry();
    await registry.hooksFor("hazard").runWith(ctx);
    return true;
  }

  private async stepSpatialMove(
    ctx: NxMovementContext,
  ): Promise<boolean> {
    const pos = getPosition(ctx.entity);
    if (!pos) return false;
    const current = pos.nodeName;

    const world = ctx.world as unknown as NxWorld;
    world.updateObjectLocation(ctx.entity, current, ctx.targetNode);
    pos.nodeName = ctx.targetNode;

    const registry = getDefaultRegistry();
    await registry.hooksFor("spatialMove").runWith(ctx);
    return true;
  }

  private async stepArrival(ctx: NxMovementContext): Promise<boolean> {
    const world = ctx.world as unknown as NxWorld;
    this.witnessSystem.arriveEntity(
      ctx.entity,
      ctx.targetNode,
      world,
    );
    const registry = getDefaultRegistry();
    await registry.hooksFor("arrival").runWith(ctx);
    return true;
  }

  private async stepAnnounce(ctx: NxMovementContext): Promise<boolean> {
    this.announcer.emit("entityMoved", {
      entity: ctx.entity,
      targetNode: ctx.targetNode,
    });
    const registry = getDefaultRegistry();
    await registry.hooksFor("announce").runWith(ctx);
    return true;
  }

  whenEntityMovedDo(
    listener: (event: NxEntityMoved) => void | Promise<void>,
  ): void {
    this.announcer.on("entityMoved", listener);
  }
}
