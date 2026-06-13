import { EventEmitter } from "../event-emitter.ts";
import type { NxComponentAdded } from "./announcements.ts";
import type { NxLocatable, NxIdentifiable } from "../types.ts";
import { NxPosition } from "./components.ts";

/** ECS entity with a component map, location tracking, and component-added announcements. */
export class NxEntity implements NxLocatable, NxIdentifiable {
  /** Unique identifier. */
  id: string;
  /** Map of component class name to component instance. */
  components: Map<string, unknown> = new Map();
  /** Event bus for component-added announcements. */
  announcer: EventEmitter<{
    componentAdded: NxComponentAdded;
  }> = new EventEmitter();

  /** Create an entity with the given id. */
  constructor(id: string) {
    this.id = id;
  }

  /** Current graph node, derived from NxPosition component. */
  get location(): string | undefined {
    return this.componentOfType(NxPosition)?.nodeName;
  }

  /** Set the current graph node via NxPosition component. */
  set location(value: string) {
    const pos = this.componentOfType(NxPosition);
    if (pos) pos.nodeName = value;
  }

  /** Add a component and emit a componentAdded announcement. */
  async addComponent(component: unknown): Promise<void> {
    const key = (component as Record<string, unknown>).constructor?.name ??
      "unknown";
    this.components.set(key, component);
    await this.announcer.emit("componentAdded", {
      component,
      entity: this,
    } as NxComponentAdded);
  }

  /** Retrieve a component by its class type. */
  componentOfType<T>(
    type: abstract new (...args: never[]) => T,
  ): T | undefined {
    const key = type.name;
    return this.components.get(key) as T | undefined;
  }

  /** Check if a component type is present. */
  hasComponent(type: abstract new (...args: never[]) => unknown): boolean {
    return this.components.has(type.name);
  }

  /** Register a listener for component-added events. */
  whenComponentAddedDo(
    listener: (event: NxComponentAdded) => void | Promise<void>,
  ): void {
    this.announcer.on("componentAdded", listener);
  }
}
