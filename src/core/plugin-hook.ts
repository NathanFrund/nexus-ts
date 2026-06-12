import { type NxPlugin, NxBlockPlugin } from "./plugin.ts";

export class NxPluginHook<T = unknown> {
  readonly plugins: NxPlugin<T>[] = [];

  addPlugin(plugin: NxPlugin<T> | ((context: T) => void | Promise<void>)): void {
    if (typeof plugin === "function") {
      this.plugins.push(new NxBlockPlugin<T>(plugin));
    } else {
      this.plugins.push(plugin);
    }
  }

  async runWith(context: T): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.enabled) {
        await plugin.execute(context);
      }
    }
  }
}
