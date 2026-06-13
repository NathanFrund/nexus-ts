type Listener<T> = (event: T) => void | Promise<void>;

/** Injectable event bus abstraction for decoupling producers from consumers. */
export interface EventBus<EventMap extends Record<string, unknown>> {
  /** Register a listener for an event. */
  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void;
  /** Unregister a previously registered listener. */
  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void;
  /** Emit an event to all registered listeners. */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void | Promise<void>;
}

/** Typed event emitter supporting sync and async listeners. Default implementation of `EventBus`. */
export class EventEmitter<EventMap extends Record<string, unknown>>
  implements EventBus<EventMap> {
  private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

  /** Register a listener for an event type. */
  on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  /** Remove a previously registered listener. */
  off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  /** Emit an event, awaiting all async listeners. */
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

  /** Alias for emit (both are async). */
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

  /** Remove all listeners for all event types. */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /** Returns the number of registered listeners for a given event. */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
