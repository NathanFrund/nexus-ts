/** Event recorded when a departure or arrival is witnessed (or not witnessed) by observers at a node. */
export class NxWitnessedEvent {
  /** Create a witnessed event. */
  constructor(
    /** Type of event (e.g. "departure", "arrival"). */
    readonly eventType: string,
    /** The observer entity, or null if none. */
    readonly observer: unknown | null,
    /** The entity that moved. */
    readonly source: unknown,
    /** The node where the event occurred. */
    readonly location: string,
  ) {}
}

/** Hazard-specific event with severity and description metadata. */
export class NxHazardEvent {
  /** The affected target node. */
  target: string;
  /** Severity of the hazard (0–1). */
  severity: number;
  /** Human-readable description. */
  description: string;

  /** Create a hazard event. */
  constructor(target: string, severity: number, description?: string) {
    this.target = target;
    this.severity = severity;
    this.description = description ?? "Travel hazard encountered";
  }
}
