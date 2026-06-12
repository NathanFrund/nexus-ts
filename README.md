# Nexus-ts

A minimal, graph-based spatial engine for agent-based simulations,
roleplaying games, and interactive narratives.

Ported to TypeScript from the [Pharo Smalltalk original](https://github.com/NathanFrund/nexus).
Designed for use with [Blenny-ts](https://github.com/NathanFrund/blenny-ts) real-time web apps,
but works standalone with any Deno/Node/Bun runtime.

**Nodes, edges, presence, witnessing, and path hazards — all driven by plain JSON maps.**

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

## Quick Start

See [`examples/village.json`](./examples/village.json) for the full world file, or build from data directly:

```ts
import { NxGraph, NxWorld, NxSimpleAgent } from "@nathanfrund/nexus";

const graph = NxGraph.loadWorld({
  graphs: {
    village: {
      nodes: {
        village: { label: "Village Square" },
        hut: { label: "Elder's Hut", properties: { npc: "Elder" } },
        forest: { label: "Forest Path", properties: { hazardLevel: "high" } },
      },
      edges: [
        { from: "village", to: "hut", distance: 1, risk: 0.0 },
        { from: "village", to: "forest", distance: 2, risk: 0.3 },
      ],
    },
  },
});

const world = new NxWorld(graph);
const thug = new NxSimpleAgent("thug", "Thug", "village");
world.addEntity(thug);

await world.moveAgent(thug, "forest");
console.log(thug.location); // "forest"
```

## Property Graph

Nodes and edges carry arbitrary metadata. No subclassing for every terrain type.

```ts
const node = new NxNode("dragonLair", "Dragon's Lair");
node.setProperty("danger", "extreme");
node.setProperty("loot", "Crown of Kings");

const node2 = NxNode.fromJSON(node.toJSON());
node2.getProperty("loot"); // "Crown of Kings"
node2.getProperty("nonexistent", "default"); // "default"
```

Reserved `~` keys (used by serialization) cannot be set as properties:

```ts
node.setProperty("~id", "x"); // throws Error
```

## Serialization

Every node and edge can round-trip through JSON. Structural fields are prefixed with `~`
to avoid collisions with custom properties.

```ts
const edge = new NxEdge("village", "forest", { distance: 2, risk: 0.3 });
edge.setProperty("encounterType", "bandits");

const json = edge.toJSON();
// { "~from": "village", "~to": "forest", "~distance": 2, "~risk": 0.3,
//   "~direction": "both", "encounterType": "bandits" }

const restored = NxEdge.fromJSON(json);
restored.getProperty("encounterType"); // "bandits"
```

To save a world, iterate over `graph.nodes` and `graph.edges`, collect `toJSON()`, and serialize.
The SurrealDB-friendly `~` prefix convention makes it easy to persist worlds in SurrealDB.

## Plugin System

Six hooks fire during every movement. Register plugins to inject game logic without
modifying the engine. All hooks are **async** — can await database calls, network requests, etc.

**Register a block plugin:**

```ts
import { getDefaultRegistry } from "@nathanfrund/nexus";

getDefaultRegistry().register("hazard", async (ctx) => {
  if ((ctx as { edge: { risk: number } }).edge.risk > 0) {
    // e.g., log to database, trigger SSE event
    console.log(`Hazard on edge with risk ${ctx.edge.risk}`);
  }
});
```

**Create a named plugin (for introspection & enable/disable at runtime):**

```ts
import { NxPlugin } from "@nathanfrund/nexus";

class HealingShrinePlugin extends NxPlugin {
  execute(ctx: unknown): void {
    const target = (ctx as { targetNode: string }).targetNode;
    if (target === "safeHouse") {
      console.log("Fully healed at the safe house!");
    }
  }
  get description(): string {
    return "Restores full health at the safe house";
  }
}

getDefaultRegistry().register("validate", new HealingShrinePlugin());
// Disable at runtime:
// registry.hooksFor("validate").plugins[0].disable();
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

Any plugin in the `validate` hook can block a move by setting `moveAllowed` to `false`.
Once set to `false`, no later plugin can re-enable it:

```ts
getDefaultRegistry().register("validate", (ctx) => {
  (ctx as { moveAllowed: boolean }).moveAllowed = false; // blocks the move permanently
});
```

## ECS Layer

The optional Entity-Component-System pipeline provides a full 6-step movement system
with typed events and witness tracking.

```ts
import { NxEntity, NxPosition, NxIdentity, NxMovementSystem } from "@nathanfrund/nexus/ecs";

const entity = new NxEntity("hero");
entity.addComponent(new NxIdentity("hero", "Sir Lancelot"));
entity.addComponent(new NxPosition("camp", graph));
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
3. **Hazard** — `hazard` hook (e.g., risk rolls)
4. **SpatialMove** — update position in graph, `spatialMove` hook
5. **Arrival** — generate witnessed arrival events, `arrival` hook
6. **Announce** — emit `entityMoved` event, `announce` hook

## Examples

The [`examples/`](./examples) directory contains runnable demos:

| File | Description |
|---|---|
| [`village.json`](./examples/village.json) | Hypergraph world file (village + dungeon, 6 nodes, 6 edges) |
| [`simple-agent.ts`](./examples/simple-agent.ts) | Load JSON world, move agents, check witnesses, cross-graph traversal |
| [`ecs-game.ts`](./examples/ecs-game.ts) | Full ECS pipeline with typed components, identity, witness subscriptions |

Run them with:

```bash
deno run --allow-read examples/simple-agent.ts
deno run --allow-read examples/ecs-game.ts
```

## Blenny-ts Integration

Nexus-ts is designed as a natural companion to [Blenny-ts](https://github.com/NathanFrund/blenny-ts):

- All hooks are **async** — compatible with Blenny's async module lifecycle (`initialize`, `start`, `stop`)
- **Event bridge** — subscribe to `NxMovementSystem.announcer` or `NxWitnessSystem.announcer` and forward events to Blenny's `TransportHub` for SSE push
- **SurrealDB persistence** — property dictionary `~` prefix convention maps cleanly to SurrealDB documents; use Blenny's existing `db` connection to persist worlds
- **TaskSupervisor** — use Blenny's background task supervisor for game loops, AI tick scheduling
- **BlennyModule adapter** — wrap a Nexus world in a `BlennyModule` with routes (`/world/:id/move`) and SSE streams (`/sse?intent=game`)

## Package Structure

| Subpath | Exports |
|---|---|
| `@nathanfrund/nexus` | All public API (core + ECS + types) |
| `@nathanfrund/nexus/core` | `NxGraph`, `NxNode`, `NxEdge`, `NxWorld`, `NxSimpleAgent`, `NxMovementContext`, `NxPlugin`, `NxPluginRegistry`, `NxPluginHook`, `NxBlockPlugin`, `NxWitnessedEvent`, `NxHazardEvent`, `NxHazardResult`, `NxDefaultRiskStrategy`, `NxHazardStrategy` |
| `@nathanfrund/nexus/ecs` | `NxEntity`, `NxPosition`, `NxIdentity`, `NxMovementSystem`, `NxWitnessSystem`, `NxArrivalEvent`, `NxDepartureEvent`, `NxEntityMoved`, `NxComponentAdded` |

## License

MIT
