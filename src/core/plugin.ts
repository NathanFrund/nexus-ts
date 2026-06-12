/** Abstract base for a plugin that registers hook callbacks into one or more pipeline hooks. */
export abstract class NxPlugin<T = unknown> {
  name: string;
  enabled: boolean;

  constructor(name?: string) {
    this.name = name ?? this.constructor.name;
    this.enabled = true;
  }

  abstract execute(context: T): void | Promise<void>;

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

/** Concrete plugin that accepts inline callback functions via a block-style builder. */
export class NxBlockPlugin<T = unknown> extends NxPlugin<T> {
  private action: (context: T) => void | Promise<void>;

  constructor(action: (context: T) => void | Promise<void>) {
    super(`block-${action.name || "anon"}`);
    this.action = action;
  }

  execute(context: T): void | Promise<void> {
    return this.action(context);
  }
}
