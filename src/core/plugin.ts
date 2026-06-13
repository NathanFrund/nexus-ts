/** Abstract base for a plugin that registers hook callbacks into one or more pipeline hooks. */
export abstract class NxPlugin<T = unknown> {
  /** Plugin name. */
  name: string;
  /** Whether this plugin is active. */
  enabled: boolean;

  /** Create a plugin with an optional name (defaults to class name). */
  constructor(name?: string) {
    this.name = name ?? this.constructor.name;
    this.enabled = true;
  }

  /** Execute this plugin with the given context. */
  abstract execute(context: T): void | Promise<void>;

  /** Called when the world starts. */
  onWorldStart?(world: unknown): void | Promise<void>;
  /** Called when the world stops. */
  onWorldStop?(world: unknown): void | Promise<void>;

  /** Human-readable description. */
  get description(): string {
    return `Plugin: ${this.name}`;
  }

  /** Activate this plugin. */
  enable(): void {
    this.enabled = true;
  }

  /** Deactivate this plugin (skipped during execution). */
  disable(): void {
    this.enabled = false;
  }
}

/** Concrete plugin that accepts inline callback functions via a block-style builder. */
export class NxBlockPlugin<T = unknown> extends NxPlugin<T> {
  private action: (context: T) => void | Promise<void>;

  /** Create a plugin from an inline callback. */
  constructor(action: (context: T) => void | Promise<void>) {
    super(`block-${action.name || "anon"}`);
    this.action = action;
  }

  /** Execute the stored callback. */
  execute(context: T): void | Promise<void> {
    return this.action(context);
  }
}
