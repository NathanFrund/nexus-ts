/**
 * Simple Agent Example
 *
 * Demonstrates loading a hypergraph world from JSON, creating agents,
 * moving them through the graph, and witnessing events.
 *
 * Usage: deno run --allow-read examples/simple-agent.ts
 */

import { NxGraph, NxWorld, NxSimpleAgent, NxHazardEvent } from "../src/mod.ts";
import { getDefaultRegistry, resetDefaultRegistry } from "../src/core/plugin-registry.ts";

resetDefaultRegistry();

// Register a hazard plugin that reports risky edges
getDefaultRegistry().register("hazard", (ctx) => {
  const edge = (ctx as { edge: { risk: number } }).edge;
  if (edge.risk > 0.5) {
    (ctx as { world: { pendingEvents: unknown[] }; targetNode: string }).world
      .pendingEvents.push(
        new NxHazardEvent(
          (ctx as { targetNode: string }).targetNode,
          edge.risk,
          "You triggered a trap!",
        ),
      );
  }
});

const jsonText = await Deno.readTextFile("examples/village.json");
const graph = NxGraph.loadWorld(JSON.parse(jsonText));
const world = new NxWorld(graph);

const hero = new NxSimpleAgent("hero", "Hero", "village");
world.addEntity(hero);

console.log("=== Nexus Simple Agent Demo ===\n");
console.log(`Start: "${hero.location}" — neighbors: ${graph.neighborsOf(hero.location).join(", ")}`);

// 1. Move to elderHut (easy, no risk)
console.log("\n--- Move to elderHut (risk 0.0) ---");
await world.moveAgent(hero, "elderHut");
console.log(`Now at: "${hero.location}"`);

// 2. Move to village (back along same bidirectional edge)
console.log("\n--- Return to village ---");
await world.moveAgent(hero, "village");
console.log(`Now at: "${hero.location}"`);

// 3. Attempt forest via backward-only edge (should fail)
console.log("\n--- Attempt forest (backward edge, village -> forest blocked) ---");
const forestOk = await world.moveAgent(hero, "forest");
console.log(`Move succeeded: ${forestOk} — still at: "${hero.location}"`);

// 4. Move to tavern
console.log("\n--- Move to tavern ---");
const bartender = new NxSimpleAgent("bark", "Bartender", "tavern");
world.addEntity(bartender);
await world.moveAgent(hero, "tavern");
console.log(`Now at: "${hero.location}"`);
const witnesses = world.agentsAtNode("tavern").map((a) => a.name);
console.log(`Agents at tavern: ${witnesses.join(", ")}`);

// 5. Check for hazards on the move
const hazards = world.pendingEvents.filter((e) => e instanceof NxHazardEvent);
if (hazards.length > 0) {
  console.log(`Hazards encountered: ${hazards.length}`);
} else {
  console.log("No hazards (risk was 0.0 on all traversed edges)");
}

console.log("\n=== Demo Complete ===");
