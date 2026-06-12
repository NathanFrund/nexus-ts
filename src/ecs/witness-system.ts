import { EventEmitter } from "../event-emitter.ts";
import type { EventBus } from "../event-emitter.ts";
import { NxWitnessedEvent } from "../core/events.ts";
import type { NxWorld } from "../core/world.ts";
import type { NxArrivalEvent, NxDepartureEvent } from "./announcements.ts";

export class NxWitnessSystem {
  announcer: EventBus<{
    departure: NxDepartureEvent;
    arrival: NxArrivalEvent;
  }>;

  constructor(
    eventBus?: EventBus<{
      departure: NxDepartureEvent;
      arrival: NxArrivalEvent;
    }>,
  ) {
    this.announcer = eventBus ?? new EventEmitter<{
      departure: NxDepartureEvent;
      arrival: NxArrivalEvent;
    }>();
  }

  async departEntity(
    entity: unknown,
    fromNode: string,
    world: NxWorld,
  ): Promise<void> {
    const observers = world.objectsAtNode(fromNode).filter(
      (o) => o !== entity,
    );
    if (observers.length === 0) {
      const event: NxDepartureEvent = {
        observer: null,
        source: entity,
        location: fromNode,
      };
      await this.announcer.emit("departure", event);
      world.pendingEvents.push(
        new NxWitnessedEvent("departure", null, entity, fromNode),
      );
    } else {
      for (const obs of observers) {
        const event: NxDepartureEvent = {
          observer: obs,
          source: entity,
          location: fromNode,
        };
        await this.announcer.emit("departure", event);
        world.pendingEvents.push(
          new NxWitnessedEvent("departure", obs, entity, fromNode),
        );
      }
    }
  }

  async arriveEntity(
    entity: unknown,
    atNode: string,
    world: NxWorld,
  ): Promise<void> {
    const observers = world.objectsAtNode(atNode).filter(
      (o) => o !== entity,
    );
    if (observers.length === 0) {
      const event: NxArrivalEvent = {
        observer: null,
        source: entity,
        location: atNode,
      };
      await this.announcer.emit("arrival", event);
      world.pendingEvents.push(
        new NxWitnessedEvent("arrival", null, entity, atNode),
      );
    } else {
      for (const obs of observers) {
        const event: NxArrivalEvent = {
          observer: obs,
          source: entity,
          location: atNode,
        };
        await this.announcer.emit("arrival", event);
        world.pendingEvents.push(
          new NxWitnessedEvent("arrival", obs, entity, atNode),
        );
      }
    }
  }

  whenDepartureHappensDo(
    listener: (event: NxDepartureEvent) => void | Promise<void>,
  ): void {
    this.announcer.on("departure", listener);
  }

  whenArrivalHappensDo(
    listener: (event: NxArrivalEvent) => void | Promise<void>,
  ): void {
    this.announcer.on("arrival", listener);
  }
}
