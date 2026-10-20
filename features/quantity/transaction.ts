import { entryVersions, recipeMealVersions, validateDocuments } from './model';
import type {
  Change,
  Document,
  Guard,
  Operation,
  QuantityState,
  Versioned,
} from './types';

/** Builds a semantic transaction against the exact versions the person saw. */
export class QuantityTransaction {
  private changes = new Map<string, Change>();
  private guards: Guard[] = [];
  constructor(readonly state: QuantityState) {
    if (!state.complete)
      throw new Error('Wait for the full quantity history to load');
  }
  require(value: Versioned) {
    this.guards.push({ kind: 'version', id: value.id, version: value.version });
  }
  requireEntries(rowId: string) {
    this.guards.push({
      kind: 'entries',
      rowId,
      versions: entryVersions(this.state, rowId),
    });
  }
  put(value: Document) {
    const { version: _version, ...document } = value as Versioned;
    this.changes.set(value.id, {
      id: value.id,
      before: this.state.documents[value.id]?.version ?? null,
      value: document as Document,
    });
  }
  requireRecipeMeals(recipeId: string) {
    this.guards.push({
      kind: 'recipeMeals',
      recipeId,
      versions: recipeMealVersions(this.state, recipeId),
    });
  }
  remove(id: string) {
    this.changes.set(id, {
      id,
      before: this.state.documents[id]?.version ?? null,
      value: null,
    });
  }
  build(id: string, label: string, resolves: string[] = []): Operation {
    const documents = { ...this.state.documents };
    for (const change of this.changes.values()) {
      if (change.value) documents[change.id] = { ...change.value, version: id };
      else delete documents[change.id];
    }
    validateDocuments(documents);
    return {
      id,
      label,
      parents: this.state.heads,
      changes: [...this.changes.values()],
      guards: this.guards,
      resolves,
    };
  }
}
