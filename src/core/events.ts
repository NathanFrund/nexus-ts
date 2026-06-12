/** Event recorded when a departure or arrival is witnessed (or not witnessed) by observers at a node. */
export class NxWitnessedEvent {
  constructor(
    readonly eventType: string,
    readonly observer: unknown | null,
    readonly source: unknown,
    readonly location: string,
  ) {}
}

/** Hazard-specific event with severity and description metadata. */
export class NxHazardEvent {
  target: string;
  severity: number;
  description: string;

  constructor(target: string, severity: number, description?: string) {
    this.target = target;
    this.severity = severity;
    this.description = description ?? "Travel hazard encountered";
  }
}
