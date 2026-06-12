import { EventEmitter } from "../event-emitter.ts";
import type { NxComponentAdded } from "./announcements.ts";

export class NxEntity {
  id: string;
  components: Map<string, unknown> = new Map();
  announcer: EventEmitter<{
    componentAdded: NxComponentAdded;
  }> = new EventEmitter();

  constructor(id: string) {
    this.id = id;
  }

  addComponent(component: unknown): void {
    const key = (component as Record<string, unknown>).constructor?.name ??
      "unknown";
    this.components.set(key, component);
    this.announcer.emit("componentAdded", {
      component,
      entity: this,
    } as NxComponentAdded);
  }

  componentOfType<T>(type: abstract new (...args: never[]) => T): T | undefined {
    const key = type.name;
    return this.components.get(key) as T | undefined;
  }

  hasComponent(type: abstract new (...args: never[]) => unknown): boolean {
    return this.components.has(type.name);
  }

  whenComponentAddedDo(
    listener: (event: NxComponentAdded) => void | Promise<void>,
  ): void {
    this.announcer.on("componentAdded", listener);
  }
}
