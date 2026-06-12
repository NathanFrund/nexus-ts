import { assertEquals } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxGraph } from "../../src/core/graph.ts";
import { NxWorld } from "../../src/core/world.ts";
import { NxSimpleAgent } from "../../src/core/simple-agent.ts";
import { resetDefaultRegistry } from "../../src/core/plugin-registry.ts";

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
  resetDefaultRegistry();
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
    (e: unknown) =>
      (e as Record<string, unknown>)["eventType"] === "departure",
  );
  assertEquals(departures.length, 1);
});

Deno.test("NxWorld - move between named graphs", async () => {
  resetDefaultRegistry();
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
  world.addEntity(traveler);

  const toGate = await world.moveAgent(traveler, "gate");
  assertEquals(toGate, true);
  assertEquals(traveler.location, "gate");

  const toCrossroads = await world.moveAgent(traveler, "crossroads");
  assertEquals(toCrossroads, true);
  assertEquals(traveler.location, "crossroads");
});
