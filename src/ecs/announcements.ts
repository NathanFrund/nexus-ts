export interface NxArrivalEvent {
  observer: unknown | null;
  source: unknown;
  location: string;
}

export interface NxDepartureEvent {
  observer: unknown | null;
  source: unknown;
  location: string;
}

export interface NxEntityMoved {
  entity: unknown;
  targetNode: string;
}

export interface NxComponentAdded {
  component: unknown;
  entity: unknown;
}
