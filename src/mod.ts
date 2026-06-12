/** @module Main entrypoint — re-exports all public API from core and ECS layers. */
export * from "./core/mod.ts";
export * from "./ecs/mod.ts";
export { EventEmitter } from "./event-emitter.ts";
export type { EventBus } from "./event-emitter.ts";
export type {
  EdgeDirection,
  NxHookName,
  PropertyContainer,
  HypergraphWorld,
  SerializedGraph,
  SerializedNode,
  SerializedEdge,
  NxLocatable,
  NxIdentifiable,
} from "./types.ts";
export { ALL_HOOKS } from "./types.ts";
