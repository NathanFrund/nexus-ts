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

  /** Collect all registered plugins from every hook. */
  allPlugins(): NxPlugin<unknown>[] {
    const result: NxPlugin<unknown>[] = [];
    for (const hook of this.hooks.values()) {
      for (const plugin of hook.plugins) {
        result.push(plugin);
      }
    }
    return result;
  }

  /** Remove all registered hooks and plugins. */
  clear(): void {
    this.hooks.clear();
  }
}
