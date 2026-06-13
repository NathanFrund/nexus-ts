import { type NxPlugin, NxBlockPlugin } from "./plugin.ts";

/** A single hook slot running registered callbacks in sequence with a single typed context. */
export class NxPluginHook<T = unknown> {
  /** Registered plugins for this hook. */
  readonly plugins: NxPlugin<T>[] = [];

  /** Register a plugin (or inline callback) for this hook. */
  addPlugin(plugin: NxPlugin<T> | ((context: T) => void | Promise<void>)): void {
    if (typeof plugin === "function") {
      this.plugins.push(new NxBlockPlugin<T>(plugin));
    } else {
      this.plugins.push(plugin);
    }
  }

  /** Execute all enabled plugins in registration order with the given context. */
  async runWith(context: T): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.enabled) {
        await plugin.execute(context);
      }
    }
  }
}
