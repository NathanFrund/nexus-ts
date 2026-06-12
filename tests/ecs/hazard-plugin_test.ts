import { assertEquals } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxGraph } from "../../src/core/graph.ts";
import { NxWorld } from "../../src/core/world.ts";
import { NxEntity } from "../../src/ecs/entity.ts";
import { NxPosition } from "../../src/ecs/components.ts";
import { NxMovementSystem } from "../../src/ecs/movement-system.ts";
import { NxHazardEvent } from "../../src/core/events.ts";
import { getDefaultRegistry, resetDefaultRegistry } from "../../src/core/plugin-registry.ts";

Deno.test("NxHazardPlugin - hazard occurs when risk is 1.0", async () => {
  resetDefaultRegistry();
  const registry = getDefaultRegistry();

  registry.register("hazard", (ctx) => {
    if (ctx.edge && ctx.edge.risk > 0) {
      ctx.world.pendingEvents.push(
        new NxHazardEvent(ctx.targetNode, ctx.edge.risk, "Rockfall!"),
      );
    }
  });

  const graph = new NxGraph();
  graph.addNode(new NxNode("top"));
  graph.addNode(new NxNode("bottom"));
  graph.addEdge("top", "bottom", { risk: 1.0 });

  const world = new NxWorld(graph);
  const entity = new NxEntity("climber");
  await entity.addComponent(new NxPosition("top", graph));
  world.addEntity(entity);

  const system = new NxMovementSystem();
  const result = await system.moveEntity(entity, "bottom", world);
  assertEquals(result, true);

  const hazardEvents = world.pendingEvents.filter(
    (e) => e instanceof NxHazardEvent,
  );
  assertEquals(hazardEvents.length, 1);
  if (hazardEvents[0] instanceof NxHazardEvent) {
    assertEquals(hazardEvents[0].target, "bottom");
    assertEquals(hazardEvents[0].severity, 1.0);
    assertEquals(hazardEvents[0].description, "Rockfall!");
  }
});
