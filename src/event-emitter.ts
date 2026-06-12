type Listener<T> = (event: T) => void | Promise<void>;

/** Injectable event bus abstraction for decoupling producers from consumers. */
export interface EventBus<EventMap extends Record<string, unknown>> {
  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void;
  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void;
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void | Promise<void>;
}

/** Typed event emitter supporting sync and async listeners. Default implementation of `EventBus`. */
export class EventEmitter<EventMap extends Record<string, unknown>>
  implements EventBus<EventMap> {
  private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  async emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): Promise<void> {
    const set = this.listeners.get(event);
    if (set) {
      const promises: Promise<void>[] = [];
      for (const listener of set) {
        const result = listener(payload);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }
  }

  async emitAsync<K extends keyof EventMap>(
    event: K,
    payload: EventMap[K],
  ): Promise<void> {
    const set = this.listeners.get(event);
    if (set) {
      const promises: Promise<void>[] = [];
      for (const listener of set) {
        const result = listener(payload);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
