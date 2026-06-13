/** Immutable result of a hazard check — whether it triggered and what message describes it. */
export class NxHazardResult {
  /** Whether a hazard occurred. */
  occurred: boolean;
  /** Severity of the hazard (clamped to 0–1). */
  severity: number;
  /** Human-readable description. */
  description: string;

  /** Create a hazard result. */
  constructor(occurred: boolean, severity: number, description: string) {
    this.occurred = occurred;
    this.severity = Math.min(1, Math.max(0, severity));
    this.description = description;
  }

  /** A no-hazard result. */
  static none(): NxHazardResult {
    return new NxHazardResult(false, 0.5, "Hazard");
  }

  /** A hazard that occurred at the given severity. */
  static withSeverity(
    severity: number,
    description: string,
  ): NxHazardResult {
    return new NxHazardResult(true, severity, description);
  }
}
