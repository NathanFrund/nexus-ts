import type { NxHookName } from "../types.ts";
import type { NxPlugin } from "./plugin.ts";
import { NxPluginHook } from "./plugin-hook.ts";

export class NxPluginRegistry {
  private hooks = new Map<NxHookName, NxPluginHook>();

  hooksFor(hookName: NxHookName): NxPluginHook {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new NxPluginHook());
    }
    return this.hooks.get(hookName)!;
  }

  register(
    hookName: NxHookName,
    plugin: NxPlugin | ((context: unknown) => void | Promise<void>),
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
