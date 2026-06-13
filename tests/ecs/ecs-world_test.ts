import { assertEquals } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxGraph } from "../../src/core/graph.ts";
import { NxWorld } from "../../src/core/world.ts";
import { NxEntity } from "../../src/ecs/entity.ts";
import { NxPosition } from "../../src/ecs/components.ts";
import { NxMovementSystem } from "../../src/ecs/movement-system.ts";
import { NxWitnessedEvent } from "../../src/core/events.ts";

Deno.test("NxECSWorld - arrival event generated on ECS movement", async () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("start"));
  graph.addNode(new NxNode("end"));
  graph.addEdge("start", "end");

  const world = new NxWorld(graph);
  const entity = new NxEntity("explorer");
  await entity.addComponent(new NxPosition("start", graph));
  world.addEntity(entity);

  const system = new NxMovementSystem();
  let arrivalEvent: unknown = null;
  system.witnessSystem.whenArrivalHappensDo((e) => {
    arrivalEvent = e;
  });

  const result = await system.moveEntity(entity, "end", world);
  assertEquals(result, true);

  assertEquals(arrivalEvent !== null, true);
  if (arrivalEvent) {
    const ev = arrivalEvent as Record<string, unknown>;
    assertEquals(ev.location, "end");
    assertEquals(ev.source, entity);
  }
});

Deno.test("NxECSWorld - departure event generated on ECS movement", async () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("start"));
  graph.addNode(new NxNode("end"));
  graph.addEdge("start", "end");

  const world = new NxWorld(graph);
  const entity = new NxEntity("explorer");
  await entity.addComponent(new NxPosition("start", graph));
  world.addEntity(entity);

  const system = new NxMovementSystem();
  let departureEvent: unknown = null;
  system.witnessSystem.whenDepartureHappensDo((e) => {
    departureEvent = e;
  });

  const result = await system.moveEntity(entity, "end", world);
  assertEquals(result, true);

  assertEquals(departureEvent !== null, true);
  if (departureEvent) {
    const ev = departureEvent as Record<string, unknown>;
    assertEquals(ev.location, "start");
    assertEquals(ev.source, entity);
  }
});

Deno.test("NxECSWorld - entity movement and witnessing", async () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("square"));
  graph.addNode(new NxNode("hut"));
  graph.addEdge("square", "hut");

  const world = new NxWorld(graph);
  const explorer = new NxEntity("explorer");
  await explorer.addComponent(new NxPosition("square", graph));
  world.addEntity(explorer);

  const bystander = new NxEntity("bystander");
  await bystander.addComponent(new NxPosition("square", graph));
  world.addEntity(bystander);

  const system = new NxMovementSystem();
  const result = await system.moveEntity(explorer, "hut", world);
  assertEquals(result, true);

  const departures = world.pendingEvents.filter(
    (e): e is NxWitnessedEvent => e.kind === "witness" && e.eventType === "departure",
  );
  const arrivals = world.pendingEvents.filter(
    (e): e is NxWitnessedEvent => e.kind === "witness" && e.eventType === "arrival",
  );

  assertEquals(departures.length, 1);
  assertEquals(arrivals.length, 1);

  const dep = departures[0];
  assertEquals(dep.location, "square");
  assertEquals(dep.observer, bystander);
  assertEquals(dep.source, explorer);
});

Deno.test("NxECSWorld - no hazard with zero risk edge", async () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("A"));
  graph.addNode(new NxNode("B"));
  graph.addEdge("A", "B", { risk: 0.0 });

  const world = new NxWorld(graph);
  const entity = new NxEntity("e1");
  await entity.addComponent(new NxPosition("A", graph));
  world.addEntity(entity);

  const system = new NxMovementSystem();
  const result = await system.moveEntity(entity, "B", world);
  assertEquals(result, true);
});
