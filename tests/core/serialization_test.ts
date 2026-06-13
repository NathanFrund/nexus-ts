import { assertEquals, assertThrows } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxEdge } from "../../src/core/edge.ts";
import { NxGraph } from "../../src/core/graph.ts";

Deno.test("NxNode - round trip with properties", () => {
  const node = new NxNode("cave", "Dark Cave");
  node.setProperty("danger", "high");
  node.setProperty("treasure", "gold");

  const json = node.toJSON();
  const restored = NxNode.fromJSON(json);

  assertEquals(restored.name, "cave");
  assertEquals(restored.label, "Dark Cave");
  assertEquals(restored.getProperty("danger"), "high");
  assertEquals(restored.getProperty("treasure"), "gold");
});

Deno.test("NxNode - round trip without properties", () => {
  const node = new NxNode("empty-room");
  const json = node.toJSON();
  const restored = NxNode.fromJSON(json);

  assertEquals(restored.name, "empty-room");
  assertEquals(restored.label, "empty-room");
});

Deno.test("NxEdge - round trip with all attributes and properties", () => {
  const edge = new NxEdge("village", "forest", {
    distance: 2,
    risk: 0.3,
    direction: "backward",
  });
  edge.setProperty("encounterType", "bandits");

  const json = edge.toJSON();
  const restored = NxEdge.fromJSON(json);

  assertEquals(restored.node1, "village");
  assertEquals(restored.node2, "forest");
  assertEquals(restored.distance, 2);
  assertEquals(restored.risk, 0.3);
  assertEquals(restored.direction, "backward");
  assertEquals(restored.getProperty("encounterType"), "bandits");
});

Deno.test("NxEdge - round trip without properties", () => {
  const edge = new NxEdge("A", "B");
  const json = edge.toJSON();
  const restored = NxEdge.fromJSON(json);

  assertEquals(restored.node1, "A");
  assertEquals(restored.node2, "B");
  assertEquals(restored.distance, 1);
  assertEquals(restored.risk, 0.0);
  assertEquals(restored.direction, "both");
});

Deno.test("NxGraph - HypergraphWorld round trip via toWorldJSON / loadWorld", () => {
  const graph = new NxGraph();
  const town = new NxNode("town", "Town Square");
  town.setProperty("population", 200);
  graph.addNode(town);
  const forest = new NxNode("forest", "Dark Forest");
  forest.setProperty("danger", "low");
  graph.addNode(forest);
  graph.addNode(new NxNode("cave"));

  graph.addEdge("town", "forest", { distance: 3, risk: 0.1 });
  graph.addEdge("forest", "cave", { distance: 5, risk: 0.8, direction: "forward" });

  const world = graph.toWorldJSON("overworld");
  assertEquals(Object.keys(world.graphs).length, 1);
  assertEquals(Object.keys(world.graphs)[0], "overworld");

  const restored = NxGraph.loadWorld(world);

  assertEquals(restored.nodes.size, 3);
  assertEquals(restored.nodeNamed("town").label, "Town Square");
  assertEquals(restored.nodeNamed("town").getProperty("population"), 200);
  assertEquals(restored.nodeNamed("forest").label, "Dark Forest");
  assertEquals(restored.nodeNamed("forest").getProperty("danger"), "low");
  assertEquals(restored.nodeNamed("cave").label, "cave");
  assertEquals(restored.edges.length, 2);

  const edge = restored.edges.find((e) => e.node1 === "town")!;
  assertEquals(edge.distance, 3);
  assertEquals(edge.risk, 0.1);
  assertEquals(edge.direction, "both");

  const edge2 = restored.edges.find((e) => e.node1 === "forest")!;
  assertEquals(edge2.distance, 5);
  assertEquals(edge2.risk, 0.8);
  assertEquals(edge2.direction, "forward");
});

Deno.test("NxGraph - toWorldJSON defaults graph name to 'default'", () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("A"));
  const world = graph.toWorldJSON();
  assertEquals(Object.keys(world.graphs)[0], "default");
});

Deno.test("NxNode/NxEdge - reserved key ~ prefix is blocked", () => {
  const node = new NxNode("test");
  assertThrows(
    () => node.setProperty("~id", "override"),
    Error,
    'Property key "~id" starts with reserved prefix "~"',
  );

  const edge = new NxEdge("A", "B");
  assertThrows(
    () => edge.setProperty("~from", "override"),
    Error,
    'Property key "~from" starts with reserved prefix "~"',
  );
});
