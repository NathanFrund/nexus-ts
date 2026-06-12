/** Payload for an entity-arrival witnessed event. */
export interface NxArrivalEvent {
  observer: unknown | null;
  source: unknown;
  location: string;
}

/** Payload for an entity-departure witnessed event. */
export interface NxDepartureEvent {
  observer: unknown | null;
  source: unknown;
  location: string;
}

/** Payload emitted by NxMovementSystem after a successful move. */
export interface NxEntityMoved {
  entity: unknown;
  targetNode: string;
}

/** Payload emitted by NxEntity.addComponent(). */
export interface NxComponentAdded {
  component: unknown;
  entity: unknown;
}
