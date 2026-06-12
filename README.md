# Nexus-ts

**An actor model runtime for spatial agents in TypeScript.**

Agents (and entities) exist in a property graph of named places. They move
along edges, witness each other's movements, react through async plugin hooks,
and spread state through the network. Think of it as a game engine for
hypermedia-driven simulations — no canvas, no render loop, just async pipelines
over a spatial graph.

Ported from the [Pharo Smalltalk original](https://github.com/NathanFrund/nexus).

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
// deno.json
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
surroundings. Every movement fires an async pipeline of six plugin hooks
(`validate`, `departure`, `hazard`, `spatialMove`, `arrival`, `announce`),
each of which can:

- Veto the move (one-way latch, never re-enables)
- Run side-effects (database writes, SSE push, sentiment propagation)
- Generate witnessed events for other agents at the same node

This is less a "spatial index" and more an **actor runtime for the web** —
agents as lightweight actors, the graph as their stage, async hooks as their
behavior.

## Property Graph

Nodes and edges carry arbitrary metadata.

```ts
const node = new NxNode("dragonLair", "Dragon's Lair");
node.setProperty("danger", "extreme");
node.setProperty("loot", "Crown of Kings");

const node2 = NxNode.fromJSON(node.toJSON());
node2.getProperty("loot"); // "Crown of Kings"
```

Reserved `~` keys (used by serialization) are blocked:

```ts
node.setProperty("~id", "x"); // throws Error
```

## Serialization

Every node and edge round-trips through JSON. Structural fields are prefixed
with `~` to avoid collisions with custom properties — SurrealDB-friendly.

```ts
const edge = new NxEdge("village", "forest", { distance: 2, risk: 0.3 });
edge.setProperty("encounterType", "bandits");

const json = edge.toJSON();
// { "~from": "village", "~to": "forest", "~distance": 2, "~risk": 0.3,
//   "~direction": "both", "encounterType": "bandits" }

const restored = NxEdge.fromJSON(json);
restored.getProperty("encounterType"); // "bandits"
```

## Plugin System

Six async hooks fire during every movement. All hooks receive a typed
`NxMovementContext` — no casts needed.

```ts
import { getDefaultRegistry } from "@nathanfrund/nexus";

getDefaultRegistry().register("hazard", (ctx) => {
  if (ctx.edge && ctx.edge.risk > 0.5) {
    ctx.world.pendingEvents.push(
      new NxHazardEvent(ctx.targetNode, ctx.edge.risk, "Trap triggered!"),
    );
  }
});
```

### Hook Reference

| Hook | When | Use Case |
|---|---|---|
| `validate` | Before any side effects | Locked doors, zone of control, permissions |
| `departure` | After validate, before witnesses | Traps that spring on leaving |
| `hazard` | Mid-traversal | Risk rolls, bandit ambushes, random encounters |
| `spatialMove` | After position is updated in graph | Terrain effects, token drops |
| `arrival` | After witnesses notified | Healing shrines, quest triggers, welcome messages |
| `announce` | After everything, end of pipeline | UI updates, telemetry, sound effects |

### One-Way Veto Latch

```ts
getDefaultRegistry().register("validate", (ctx) => {
  ctx.moveAllowed = false; // blocks the move permanently
});
```

## ECS Layer

The optional Entity-Component-System layer extends a core entity with typed
component access, a 6-step async movement pipeline, and witnessed events.

```ts
import { NxEntity, NxPosition, NxIdentity, NxMovementSystem } from "@nathanfrund/nexus/ecs";

const entity = new NxEntity("hero");
await entity.addComponent(new NxIdentity("hero", "Sir Lancelot"));
await entity.addComponent(new NxPosition("camp", graph));
world.addEntity(entity);

const system = new NxMovementSystem();

system.witnessSystem.whenArrivalHappensDo((e) => {
  console.log(`Entity arrived at ${e.location}`);
});

await system.moveEntity(entity, "castle", world);
```

### Movement Pipeline (6 steps)

1. **Validate** — edge check, `validate` hook, veto latch
2. **Departure** — `departure` hook, generate witnessed departure events
3. **Hazard** — `hazard` hook (risk rolls)
4. **SpatialMove** — update position in graph, `spatialMove` hook
5. **Arrival** — generate witnessed arrival events, `arrival` hook
6. **Announce** — emit `entityMoved` event, `announce` hook

### Event Bus

The `EventBus` abstraction (`EventBus<EventMap>`) decouples event producers
from consumers. Both `NxWitnessSystem` and `NxMovementSystem` accept an
injectable `EventBus` — bridge it to Blenny's `TransportHub` for SSE push:

```ts
import type { EventBus } from "@nathanfrund/nexus";

class BlennyEventBus implements EventBus<{ entityMoved: NxEntityMoved }> {
  on(event, listener) { /* delegate to TransportHub.subscribe */ }
  off(event, listener) { /* delegate to TransportHub.unsubscribe */ }
  emit(event, payload) { /* delegate to TransportHub.broadcast */ }
}

const system = new NxMovementSystem(undefined, new BlennyEventBus());
```

## Examples

| File | Description |
|---|---|
| [`village.json`](./examples/village.json) | Hypergraph world file (village + dungeon, 6 nodes, 6 edges) |
| [`simple-agent.ts`](./examples/simple-agent.ts) | Load JSON world, move agents, check witnesses, cross-graph traversal |
| [`ecs-game.ts`](./examples/ecs-game.ts) | Full ECS pipeline with typed components, identity, witness subscriptions |

```bash
deno run --allow-read examples/simple-agent.ts
deno run --allow-read examples/ecs-game.ts
```

## Blenny-ts Integration

Nexus-ts is a natural companion to [Blenny-ts](https://github.com/NathanFrund/blenny-ts):

- **Async hooks** — compatible with Blenny's async module lifecycle
- **EventBus bridge** — inject a Blenny-backed `EventBus` for SSE push
- **SurrealDB persistence** — `~` prefix convention maps cleanly to SurrealDB docs
- **TaskSupervisor** — game loops and AI tick scheduling
- **BlennyModule adapter** — wrap a world in routes (`/world/:id/move`) and SSE streams

## Ecosystem Position

| What you need | Use |
|---|---|
| Property graph with simulation hooks | **nexus-ts** |
| Graph storage / query | Graphology, Cytoscape.js |
| Spatial indexing (static points) | kdbush, rbush |
| ECS for rendering | ESEngine, bitecs |
| State machines | XState |

nexus-ts fills the intersection of **spatial graph + async actor pipeline** —
a gap no other TS library covers.

## Package Structure

| Subpath | Exports |
|---|---|
| `@nathanfrund/nexus` | All public API |
| `@nathanfrund/nexus/core` | `NxGraph`, `NxNode`, `NxEdge`, `NxWorld`, `NxSimpleAgent`, `NxMovementContext`, `NxPlugin`, `NxPluginRegistry`, `NxPluginHook`, `NxBlockPlugin`, `NxWitnessedEvent`, `NxHazardEvent`, `NxHazardResult`, `HookContextMap` |
| `@nathanfrund/nexus/ecs` | `NxEntity`, `NxPosition`, `NxIdentity`, `NxMovementSystem`, `NxWitnessSystem`, event types |

## License

MIT
