export class NxWitnessedEvent {
  constructor(
    readonly eventType: string,
    readonly observer: unknown | null,
    readonly source: unknown,
    readonly location: string,
  ) {}
}

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
