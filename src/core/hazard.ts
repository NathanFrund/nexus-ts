import type { NxEdge } from "./edge.ts";

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

export abstract class NxHazardStrategy {
  abstract evaluateFor(
    entity: unknown,
    edge: NxEdge,
  ): NxHazardResult | Promise<NxHazardResult>;
}

export class NxDefaultRiskStrategy extends NxHazardStrategy {
  evaluateFor(_entity: unknown, edge: NxEdge): NxHazardResult {
    const risk = edge.risk ?? 0.0;
    if (risk <= 0) return NxHazardResult.none();
    if (Math.random() <= risk) {
      return NxHazardResult.withSeverity(risk, "Travel hazard encountered");
    }
    return NxHazardResult.none();
  }
}
