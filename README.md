# Nexus-ts

**An actor model runtime for spatial agents in TypeScript.**

Agents exist in a property graph of named places. They move along edges,
witness each other's movements, react through async plugin hooks, and spread
state through the network. Think of it as a game engine for hypermedia-driven
simulations — no canvas, no render loop, just async pipelines over a spatial
graph.

Ported from the [Pharo Smalltalk original](https://github.com/NathanFrund/nexus).
Core API unchanged; TypeScript adds generics, discriminated events, an
optional ECS layer, and explicit dependency injection.

```ts
import { NxGraph, NxWorld, NxSimpleAgent } from "@nathanfrund/nexus";

const world = new NxWorld(NxGraph.loadWorld(villageJson));
const hero = new NxSimpleAgent("hero", "Hero", "village");
world.addEntity(hero);

await world.moveAgent(hero, "forest");
```

Designed for [Blenny-ts](https://github.com/NathanFrund/blenny-ts) real-time
web apps, but works standalone with any Deno/Node/Bun runtime.

## Installation

```json
{
  "imports": {
    "@nathanfrund/nexus": "jsr:@nathanfrund/nexus@^0.1"
  }
}
```

```ts
import { NxGraph, NxWorld, NxSimpleAgent } from "@nathanfrund/nexus";
```

## Why an Actor Model?

Most graph libraries model static relationships. nexus-ts models **agents in
motion** — actors that occupy nodes, traverse edges, and react to their
surroundings. Every movement fires an async pipeline of six plugin hooks,
each of which can:

- Veto the move (one-way latch, never re-enables)
- Run side-effects (database writes, SSE push, sentiment propagation)
- Generate witnessed events for other agents at the same node

This is less a "spatial index" and more an **actor runtime** — agents as
lightweight actors, the graph as their stage, async hooks as their behavior.

## Property Graph

Nodes and edges carry arbitrary metadata.

```ts
const node = new NxNode("dragonLair", "Dragon's Lair");
node.setProperty("danger", "extreme");
node.setProperty("loot", "Crown of Kings");

const copy = NxNode.fromJSON(node.toJSON());
copy.getProperty("loot"); // "Crown of Kings"

node.setProperty("~id", "x"); // throws Error — reserved prefix
```

## Serialization

Structural fields use `~` prefix to avoid collisions with custom properties.
SurrealDB-friendly.

```ts
const edge = new NxEdge("village", "forest", { distance: 2, risk: 0.3 });
edge.setProperty("encounterType", "bandits");

edge.toJSON();
// { "~from": "village", "~to": "forest", "~distance": 2, "~risk": 0.3,
//   "~direction": "both", "encounterType": "bandits" }
```

## Plugin System

Create a registry, register hooks, and inject it into the world or movement
system. No global state — each world gets its own registry by default, or you
can share one explicitly.

```ts
import { NxPluginRegistry, NxWorld, NxSimpleAgent } from "@nathanfrund/nexus";

const registry = new NxPluginRegistry();
registry.register("hazard", (ctx) => {
  if (ctx.edge && ctx.edge.risk > 0.5) {
    ctx.world.pendingEvents.push(
      new NxHazardEvent(ctx.targetNode, ctx.edge.risk, "Trap triggered!"),
    );
  }
});

const world = new NxWorld(graph, registry); // inject explicit registry
```

The 6 pipeline hooks fire in order for **both** simple agents and ECS entities:

| Hook | When | Use Case |
|---|---|---|
| `validate` | Before any side effects | Locked doors, permissions |
| `departure` | After validate, before witnesses | Traps that spring on leaving |
| `hazard` | Mid-traversal | Risk rolls, random encounters |
| `spatialMove` | After position is updated | Terrain effects, token drops |
| `arrival` | After witnesses notified | Healing shrines, quest triggers |
| `announce` | End of pipeline | UI updates, telemetry |

### One-Way Veto

```ts
registry.register("validate", (ctx) => {
  ctx.moveAllowed = false; // blocks once, never re-enables
});
```

### Lifecycle Hooks

Plugins can define `onWorldStart` / `onWorldStop` for setup and teardown.
Called by `world.start()` / `world.stop()` — use with Blenny supervisors.

```ts
class MyPlugin extends NxPlugin {
  async onWorldStart(world: NxWorld) {
    console.log(`World ${world.graph.nodeNames.length} nodes ready`);
  }
}
```

### Cross-Hook State

Use `ctx.previousNode` (set automatically by the departure step) and
`ctx.getPluginData` / `ctx.setPluginData` for plugin-scoped data.

```ts
registry.register("departure", (ctx) => {
  ctx.setPluginData("leftAt", Date.now());
});

registry.register("arrival", (ctx) => {
  const elapsed = Date.now() - ctx.getPluginData<number>("leftAt")!;
  console.log(`Travel took ${elapsed}ms`);
});
```

## Events

`world.pendingEvents` is a typed `NxWorldEvent[]` — a discriminated union of
`NxWitnessedEvent` (`.kind = "witness"`) and `NxHazardEvent`
(`.kind = "hazard"`). Use the `kind` discriminant for exhaustiveness:

```ts
for (const event of world.pendingEvents) {
  if (event.kind === "witness") {
    console.log(event.eventType, event.observer, event.source);
  } else {
    console.log("Hazard:", event.severity, event.description);
  }
}
```

Both simple agents and ECS entities generate departure and arrival witnessed
events. The ECS layer additionally emits `NxWitnessSystem` events on an
injectable `EventBus`.

## ECS Layer

The optional Entity-Component-System layer adds typed components, component
announcements, and a dedicated `NxMovementSystem` with witness subscriptions.

```ts
import { NxEntity, NxPosition, NxIdentity } from "@nathanfrund/nexus/ecs";
import { NxMovementSystem } from "@nathanfrund/nexus/ecs";

const entity = new NxEntity("hero");
await entity.addComponent(new NxIdentity("hero", "Sir Lancelot"));
await entity.addComponent(new NxPosition("camp", graph));
world.addEntity(entity);

const system = new NxMovementSystem(undefined, undefined, registry);
system.witnessSystem.whenArrivalHappensDo((e) => {
  console.log(`Arrived at ${e.location}`);
});

await system.moveEntity(entity, "castle", world);
```

### Event Bus

Inject a custom `EventBus` for Blenny SSE push:

```ts
import type { EventBus } from "@nathanfrund/nexus";

class BlennyEventBus implements EventBus<{ entityMoved: NxEntityMoved }> {
  on(event, listener) { /* delegate to TransportHub.subscribe */ }
  off(event, listener) { /* delegate to TransportHub.unsubscribe */ }
  emit(event, payload) { /* delegate to TransportHub.broadcast */ }
}

const system = new NxMovementSystem(undefined, new BlennyEventBus(), registry);
```

## Examples

| File | Description |
|---|---|
| [`village.json`](./examples/village.json) | Hypergraph world (village + dungeon, 6 nodes, 6 edges) |
| [`simple-agent.ts`](./examples/simple-agent.ts) | Load JSON world, move agents, check witnesses |
| [`ecs-game.ts`](./examples/ecs-game.ts) | Full ECS pipeline with typed components, witness subscriptions |

```bash
deno run --allow-read examples/simple-agent.ts
deno run --allow-read examples/ecs-game.ts
```

## Blenny-ts Integration

Nexus-ts is built for [Blenny-ts](https://github.com/NathanFrund/blenny-ts):

- **Async hooks** — compatible with Blenny's async module lifecycle
- **EventBus bridge** — inject a Blenny-backed `EventBus` for SSE push
- **SurrealDB persistence** — `~` prefix convention maps cleanly to SurrealDB docs
- **World lifecycle** — `world.start()` / `world.stop()` for supervisor-managed worlds
- **No global state** — each world carries its own plugin registry; supervisors
  can spawn and destroy worlds independently

## Package Structure

| Subpath | Exports |
|---|---|
| `@nathanfrund/nexus` | All public API |
| `@nathanfrund/nexus/core` | `NxGraph`, `NxNode`, `NxEdge`, `NxWorld`, `NxSimpleAgent`, `NxMovementContext`, `NxPlugin`, `NxPluginRegistry`, `NxPluginHook`, `NxBlockPlugin`, `NxWitnessedEvent`, `NxHazardEvent`, `NxWorldEvent`, `NxHazardResult`, `HookContextMap` |
| `@nathanfrund/nexus/ecs` | `NxEntity`, `NxPosition`, `NxIdentity`, `NxMovementSystem`, `NxWitnessSystem`, event types |

## License

MIT
