export interface RevisionedState<T> { value: T; revision: number; }

export class RevisionState<T> {
  private state: RevisionedState<T>;
  constructor(initial: T) { this.state = { value: initial, revision: 0 }; }
  get(): RevisionedState<T> { return { ...this.state }; }
  mutate(expectedRevision: number, next: T): RevisionedState<T> | null {
    if (expectedRevision !== this.state.revision) return null;
    this.state = { value: next, revision: this.state.revision + 1 };
    return this.get();
  }
}

export interface EventEnvelope<T = unknown> {
  type: string;
  version: 1;
  workspaceId: string;
  sessionId: string;
  revision: number;
  requestId: string;
  payload: T;
  error?: { code: string; message: string };
}

export function createEvent<T>(input: Omit<EventEnvelope<T>, 'version'>): EventEnvelope<T> {
  return { ...input, version: 1 };
}

export function canApplyEvent(currentRevision: number, eventRevision: number): boolean {
  return eventRevision > currentRevision;
}
