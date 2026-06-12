export abstract class NxPlugin {
  name: string;
  enabled: boolean;

  constructor(name?: string) {
    this.name = name ?? this.constructor.name;
    this.enabled = true;
  }

  abstract execute(context: unknown): void | Promise<void>;

  get description(): string {
    return `Plugin: ${this.name}`;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

export class NxBlockPlugin extends NxPlugin {
  private action: (context: unknown) => void | Promise<void>;

  constructor(action: (context: unknown) => void | Promise<void>) {
    super(`block-${action.name || "anon"}`);
    this.action = action;
  }

  execute(context: unknown): void | Promise<void> {
    return this.action(context);
  }
}
