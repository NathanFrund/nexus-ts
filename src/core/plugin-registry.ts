import { NxPluginHook } from "./plugin-hook.ts";
import type { NxPlugin } from "./plugin.ts";
import type { NxMovementContext } from "./movement-context.ts";

export interface HookContextMap {
  validate: NxMovementContext;
  departure: NxMovementContext;
  hazard: NxMovementContext;
  spatialMove: NxMovementContext;
  arrival: NxMovementContext;
  announce: NxMovementContext;
}

export class NxPluginRegistry {
  private hooks = new Map<keyof HookContextMap, NxPluginHook<unknown>>();

  hooksFor<K extends keyof HookContextMap>(
    hookName: K,
  ): NxPluginHook<HookContextMap[K]> {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new NxPluginHook<HookContextMap[K]>());
    }
    return this.hooks.get(hookName)! as NxPluginHook<HookContextMap[K]>;
  }

  register<K extends keyof HookContextMap>(
    hookName: K,
    plugin:
      | NxPlugin<HookContextMap[K]>
      | ((context: HookContextMap[K]) => void | Promise<void>),
  ): void {
    this.hooksFor(hookName).addPlugin(plugin);
  }

  clear(): void {
    this.hooks.clear();
  }
}

let defaultRegistry: NxPluginRegistry | undefined;

export function getDefaultRegistry(): NxPluginRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new NxPluginRegistry();
  }
  return defaultRegistry;
}

export function resetDefaultRegistry(): void {
  defaultRegistry = undefined;
}
