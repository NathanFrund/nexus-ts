import { assertEquals, assertThrows } from "@std/assert";
import { NxNode } from "../../src/core/node.ts";
import { NxGraph } from "../../src/core/graph.ts";

Deno.test("NxGraph - neighbors basic (bidirectional)", () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("A"));
  graph.addNode(new NxNode("B"));
  graph.addEdge("A", "B");

  const neighborsOfA = graph.neighborsOf("A");
  assertEquals(neighborsOfA, ["B"]);

  const neighborsOfB = graph.neighborsOf("B");
  assertEquals(neighborsOfB, ["A"]);
});

Deno.test("NxGraph - node lookup", () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("alpha", "Alpha Node"));

  const node = graph.nodeNamed("alpha");
  assertEquals(node.name, "alpha");
  assertEquals(node.label, "Alpha Node");

  assertThrows(
    () => graph.nodeNamed("nonexistent"),
    Error,
    'Node "nonexistent" not found',
  );
});

Deno.test("NxGraph - one-way neighbor (forward edge)", () => {
  const graph = new NxGraph();
  graph.addNode(new NxNode("A"));
  graph.addNode(new NxNode("B"));
  graph.addEdge("A", "B", { direction: "forward" });

  assertEquals(graph.neighborsOf("A"), ["B"]);
  assertEquals(graph.neighborsOf("B"), []);
});
