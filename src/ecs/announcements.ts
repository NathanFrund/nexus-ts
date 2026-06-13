/** Payload for an entity-arrival witnessed event. */
export interface NxArrivalEvent {
  /** The observer entity, or null if no observers. */
  observer: unknown | null;
  /** The entity that arrived. */
  source: unknown;
  /** The destination node. */
  location: string;
}

/** Payload for an entity-departure witnessed event. */
export interface NxDepartureEvent {
  /** The observer entity, or null if no observers. */
  observer: unknown | null;
  /** The entity that departed. */
  source: unknown;
  /** The source node. */
  location: string;
}

/** Payload emitted by NxMovementSystem after a successful move. */
export interface NxEntityMoved {
  /** The entity that moved. */
  entity: unknown;
  /** The destination node. */
  targetNode: string;
}

/** Payload emitted by NxEntity.addComponent(). */
export interface NxComponentAdded {
  /** The component that was added. */
  component: unknown;
  /** The entity the component was added to. */
  entity: unknown;
}
