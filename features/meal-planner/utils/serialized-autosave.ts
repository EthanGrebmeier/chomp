/** Serializes editor writes and invalidates queued saves when an editor closes. */
export class SerializedAutosave {
  private generation = 0;
  private snapshot: string | null = null;
  private stopped = true;
  private tail: Promise<void> = Promise.resolve();

  reset(snapshot: string) {
    this.generation += 1;
    this.snapshot = snapshot;
    this.stopped = false;
  }

  flush() {
    return this.tail;
  }

  stop() {
    this.stopped = true;
    this.generation += 1;
    return this.tail;
  }

  save(snapshot: string, write: () => Promise<unknown>) {
    const generation = this.generation;
    const result = this.tail.then(async () => {
      if (
        this.stopped ||
        generation !== this.generation ||
        snapshot === this.snapshot
      )
        return;
      await write();
      if (generation === this.generation) this.snapshot = snapshot;
    });
    this.tail = result.catch(() => {});
    return result;
  }
}
