import { assertEquals } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxGraph } from "../../src/core/graph.ts";
import { NxWorld } from "../../src/core/world.ts";
import { NxEntity } from "../../src/ecs/entity.ts";
import { NxPosition } from "../../src/ecs/components.ts";
import { NxMovementSystem } from "../../src/ecs/movement-system.ts";
import { ALL_HOOKS } from "../../src/types.ts";
import { getDefaultRegistry, resetDefaultRegistry } from "../../src/core/plugin-registry.ts";

Deno.test("NxHookWiring - all 6 hooks execute in order during ECS movement", async () => {
  resetDefaultRegistry();
  const order: string[] = [];
  const registry = getDefaultRegistry();

  for (const hook of ALL_HOOKS) {
    registry.register(hook, () => {
      order.push(hook);
    });
  }

  const graph = new NxGraph();
  graph.addNode(new NxNode("start"));
  graph.addNode(new NxNode("end"));
  graph.addEdge("start", "end");

  const world = new NxWorld(graph);
  const entity = new NxEntity("e1");
  entity.addComponent(new NxPosition("start", graph));
  world.addEntity(entity);

  const system = new NxMovementSystem();
  const result = await system.moveEntity(entity, "end", world);
  assertEquals(result, true);

  assertEquals(order, [
    "validate",
    "departure",
    "hazard",
    "spatialMove",
    "arrival",
    "announce",
  ]);
});
