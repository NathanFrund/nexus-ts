import { NxPluginHook } from "./plugin-hook.ts";
import type { NxPlugin } from "./plugin.ts";
import type { NxMovementContext } from "./movement-context.ts";

/** Maps each hook name to the context type its callbacks receive. Eliminates need for type casts at invocation sites. */
export interface HookContextMap {
  /** Context for the validate hook. */
  validate: NxMovementContext;
  /** Context for the departure hook. */
  departure: NxMovementContext;
  /** Context for the hazard hook. */
  hazard: NxMovementContext;
  /** Context for the spatialMove hook. */
  spatialMove: NxMovementContext;
  /** Context for the arrival hook. */
  arrival: NxMovementContext;
  /** Context for the announce hook. */
  announce: NxMovementContext;
}

/** Registry of plugin hooks keyed by hook name. Supports injection for multi-world isolation. */
export class NxPluginRegistry {
  private hooks = new Map<keyof HookContextMap, NxPluginHook<unknown>>();

  /** Get (or lazily create) the plugin hook for a given hook name. */
  hooksFor<K extends keyof HookContextMap>(
    hookName: K,
  ): NxPluginHook<HookContextMap[K]> {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new NxPluginHook<HookContextMap[K]>());
    }
    return this.hooks.get(hookName)! as NxPluginHook<HookContextMap[K]>;
  }

  /** Register a plugin (or callback) for a given hook. */
  register<K extends keyof HookContextMap>(
    hookName: K,
    plugin:
      | NxPlugin<HookContextMap[K]>
      | ((context: HookContextMap[K]) => void | Promise<void>),
  ): void {
    this.hooksFor(hookName).addPlugin(plugin);
  }

  /** Remove all registered hooks and plugins. */
  clear(): void {
    this.hooks.clear();
  }
}

let defaultRegistry: NxPluginRegistry | undefined;

/** Returns the shared singleton default registry, creating it if needed. */
export function getDefaultRegistry(): NxPluginRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new NxPluginRegistry();
  }
  return defaultRegistry;
}

/** Resets the shared default registry to a clean state (useful for testing). */
export function resetDefaultRegistry(): void {
  defaultRegistry = undefined;
}
