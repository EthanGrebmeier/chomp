export type DuplicateResolutionChoice = 'increment' | 'separate';

export type DuplicateItemFields = {
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  notes?: string | null;
  storeId?: string | null;
};

export type IncomingDuplicateItem = DuplicateItemFields & {
  sourceId: string;
  sourceKind: 'recipe-ingredient' | 'meal-plan-item';
  recipeId?: string;
};

export type ExistingDuplicateItem = DuplicateItemFields & {
  id: string;
  listId: string;
  isChecked: boolean;
  isDeleted?: boolean | null;
  updatedAt?: string | null;
};

export type DuplicateConflict = {
  id: string;
  incoming: IncomingDuplicateItem;
  candidates: ExistingDuplicateItem[];
  targetId: string | null;
  canIncrement: boolean;
  incrementBlockedReason: 'unit' | 'store' | 'unit-and-store' | null;
};

export type DuplicateDetection = {
  listId: string;
  incoming: IncomingDuplicateItem[];
  conflicts: DuplicateConflict[];
  nonConflicting: IncomingDuplicateItem[];
};

export type DuplicateDecisions = Record<string, DuplicateResolutionChoice>;

export type DuplicateResolutionPlan = {
  creates: IncomingDuplicateItem[];
  increments: {
    targetId: string;
    quantityDelta: number;
    sources: IncomingDuplicateItem[];
  }[];
};

export type DuplicateResolutionError = {
  code: 'unresolved' | 'invalid-decision' | 'invalid-input' | 'stale-input';
  conflictIds: string[];
  message: string;
};

export type DuplicateResolutionResult =
  | { ok: true; plan: DuplicateResolutionPlan }
  | { ok: false; errors: DuplicateResolutionError[] };
