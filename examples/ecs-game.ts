/**
 * ECS Game Example
 *
 * Demonstrates the Entity-Component-System pipeline:
 * entities with components, the 6-step movement system,
 * witness events, and custom plugins.
 *
 * Usage: deno run --allow-read examples/ecs-game.ts
 */

import { NxNode, NxGraph, NxWorld } from "../src/mod.ts";
import { NxEntity, NxPosition, NxIdentity, NxMovementSystem } from "../src/ecs/mod.ts";
import { getDefaultRegistry, resetDefaultRegistry } from "../src/core/plugin-registry.ts";

resetDefaultRegistry();

// Build a simple graph
const graph = new NxGraph();
graph.addNode(new NxNode("camp", "Hero Camp"));
graph.addNode(new NxNode("bridge", "Old Bridge"));
graph.addNode(new NxNode("castle", "Castle Gate"));
graph.addEdge("camp", "bridge", { risk: 0.0 });
graph.addEdge("bridge", "castle", { risk: 0.4 });

const world = new NxWorld(graph);

// Create ECS entities
const hero = new NxEntity("hero");
await hero.addComponent(new NxIdentity("hero", "Sir Lancelot"));
await hero.addComponent(new NxPosition("camp", graph));
world.addEntity(hero);

const guard = new NxEntity("guard");
await guard.addComponent(new NxIdentity("guard", "Gate Guard"));
await guard.addComponent(new NxPosition("castle", graph));
world.addEntity(guard);

console.log("=== ECS Game Demo ===");

// Register a heal-at-camp plugin
getDefaultRegistry().register("arrival", (ctx) => {
  if (ctx.targetNode === "camp") {
    console.log("You rest at camp and recover your strength.");
  }
});

// Register a bridge toll plugin
getDefaultRegistry().register("validate", (ctx) => {
  if (ctx.targetNode === "bridge") {
    console.log("The bridge keeper demands a toll!");
  }
});

// Create the movement system and subscribe to events
const system = new NxMovementSystem();

system.witnessSystem.whenDepartureHappensDo((e) => {
  const name = (
    e.source as NxEntity
  ).componentOfType(NxIdentity)?.name ?? "Unknown";
  const loc = e.location;
  console.log(`${name} departs from "${loc}"`);
});

system.witnessSystem.whenArrivalHappensDo((e) => {
  const name = (
    e.source as NxEntity
  ).componentOfType(NxIdentity)?.name ?? "Unknown";
  const loc = e.location;
  if (e.observer) {
    const observerName = (
      e.observer as NxEntity
    ).componentOfType(NxIdentity)?.name ?? "Someone";
    console.log(`${observerName} sees ${name} arrive at "${loc}"`);
  } else {
    console.log(`${name} arrives at "${loc}" (no witnesses)`);
  }
});

// Move the hero through the world
console.log("\n--- Move 1: Camp to Bridge ---");
await system.moveEntity(hero, "bridge", world);

console.log("\n--- Move 2: Bridge to Castle ---");
await system.moveEntity(hero, "castle", world);

// Check the spatial index
console.log("\n--- Spatial Snapshot ---");
const atCastle = world.objectsAtNode("castle");
console.log(`Entities at castle: ${atCastle.length}`);
for (const obj of atCastle) {
  const identity = (obj as NxEntity).componentOfType(NxIdentity);
  if (identity) console.log(`  - ${identity.name}`);
}

// Move back to camp
console.log("\n--- Move 3: Castle to Camp ---");
await system.moveEntity(hero, "camp", world);

console.log("\n=== ECS Demo Complete ===");
