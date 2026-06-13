import { NxWorldEvent, NxWitnessedEvent } from "../../src/core/events.ts";
import { assertEquals } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxGraph } from "../../src/core/graph.ts";
import { NxWorld } from "../../src/core/world.ts";
import { NxSimpleAgent } from "../../src/core/simple-agent.ts";

Deno.test("NxWorld - agents at node", () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("village"));
  graph.addNode(new NxNode("forest"));

  const world = new NxWorld(graph);
  const thug = new NxSimpleAgent("thug", "Thug", "village");
  const elder = new NxSimpleAgent("elder", "Elder", "elderHut");

  world.addEntity(thug);
  world.addEntity(elder);

  const atVillage = world.agentsAtNode("village");
  assertEquals(atVillage.length, 1);
  assertEquals(atVillage[0].name, "Thug");
});

Deno.test("NxWorld - witnessed events on simple agent move", async () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("village"));
  graph.addNode(new NxNode("forest"));
  graph.addEdge("village", "forest", { distance: 2, risk: 0.0 });

  const world = new NxWorld(graph);
  const thug = new NxSimpleAgent("thug", "Thug", "village");
  const elder = new NxSimpleAgent("elder", "Elder", "village");
  world.addEntity(thug);
  world.addEntity(elder);

  const result = await world.moveAgent(thug, "forest");
  assertEquals(result, true);
  assertEquals(thug.location, "forest");

  const departures = world.pendingEvents.filter(
    (e): e is NxWorldEvent => e.kind === "witness" && e.eventType === "departure",
  );
  assertEquals(departures.length, 1);
});

Deno.test("NxWorld - move between named graphs", async () => {
  const graph = NxGraph.loadWorld({
    graphs: {
      village: {
        nodes: {
          square: { label: "Town Square" },
          gate: { label: "City Gate" },
        },
        edges: [{ from: "square", to: "gate", distance: 1 }],
      },
      outside: {
        nodes: {
          crossroads: { label: "Crossroads" },
        },
        edges: [{ from: "gate", to: "crossroads", distance: 5 }],
      },
    },
  });

  const world = new NxWorld(graph);
  const traveler = new NxSimpleAgent("t1", "Traveler", "square");
  const villager = new NxSimpleAgent("v1", "Villager", "square");
  world.addEntity(traveler);
  world.addEntity(villager);

  // -- First move: traveler leaves square for gate, villager observes departure --
  const toGate = await world.moveAgent(traveler, "gate");
  assertEquals(toGate, true);
  assertEquals(traveler.location, "gate");
  assertEquals(villager.location, "square");

  const firstDepartures = world.pendingEvents.filter(
    (e): e is NxWitnessedEvent => e.kind === "witness" && e.eventType === "departure",
  );
  assertEquals(firstDepartures.length, 1);
  assertEquals(firstDepartures[0].observer, villager);
  assertEquals(firstDepartures[0].source, traveler);
  assertEquals(firstDepartures[0].location, "square");

  const firstArrivals = world.pendingEvents.filter(
    (e): e is NxWitnessedEvent => e.kind === "witness" && e.eventType === "arrival",
  );
  assertEquals(firstArrivals.length, 1);
  assertEquals(firstArrivals[0].observer, null);
  assertEquals(firstArrivals[0].source, traveler);
  assertEquals(firstArrivals[0].location, "gate");

  // -- Second move: traveler continues alone to crossroads, no one observes --
  const toCrossroads = await world.moveAgent(traveler, "crossroads");
  assertEquals(toCrossroads, true);
  assertEquals(traveler.location, "crossroads");

  const secondDepartures = world.pendingEvents.filter(
    (e): e is NxWitnessedEvent => e.kind === "witness" && e.eventType === "departure",
  );
  assertEquals(secondDepartures.length, 1);
  assertEquals(secondDepartures[0].observer, null);
  assertEquals(secondDepartures[0].source, traveler);
  assertEquals(secondDepartures[0].location, "gate");

  const secondArrivals = world.pendingEvents.filter(
    (e): e is NxWitnessedEvent => e.kind === "witness" && e.eventType === "arrival",
  );
  assertEquals(secondArrivals.length, 1);
  assertEquals(secondArrivals[0].observer, null);
  assertEquals(secondArrivals[0].source, traveler);
  assertEquals(secondArrivals[0].location, "crossroads");
});
