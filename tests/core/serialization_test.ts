import { assertEquals, assertThrows } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxEdge } from "../../src/core/edge.ts";

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
