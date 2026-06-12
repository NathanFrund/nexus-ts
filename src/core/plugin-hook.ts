import { type NxPlugin, NxBlockPlugin } from "./plugin.ts";

export class NxPluginHook {
  readonly plugins: NxPlugin[] = [];

  addPlugin(plugin: NxPlugin | ((context: unknown) => void | Promise<void>)): void {
    if (typeof plugin === "function") {
      this.plugins.push(new NxBlockPlugin(plugin));
    } else {
      this.plugins.push(plugin);
    }
  }

  async runWith(context: unknown): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.enabled) {
        await plugin.execute(context);
      }
    }
  }
}
