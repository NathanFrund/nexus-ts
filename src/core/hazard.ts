export class NxHazardResult {
  occurred: boolean;
  severity: number;
  description: string;

  constructor(occurred: boolean, severity: number, description: string) {
    this.occurred = occurred;
    this.severity = Math.min(1, Math.max(0, severity));
    this.description = description;
  }

  static none(): NxHazardResult {
    return new NxHazardResult(false, 0.5, "Hazard");
  }

  static withSeverity(
    severity: number,
    description: string,
  ): NxHazardResult {
    return new NxHazardResult(true, severity, description);
  }
}
