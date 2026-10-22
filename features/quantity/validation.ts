import type { Document, Operation } from './types';

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string';
const identity = (value: unknown): value is string =>
  text(value) &&
  value.length > 0 &&
  !['__proto__', 'constructor', 'prototype'].includes(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(identity);
const nullableId = (value: unknown) => value === null || identity(value);
const fields = (value: Record<string, unknown>, names: string[]) =>
  names.every(name => text(value[name]));
const ingredient = (value: unknown) =>
  object(value) &&
  identity(value.id) &&
  fields(value, ['name', 'unit', 'notes', 'category', 'store']) &&
  typeof value.quantity === 'number';

/** The server stores JSON intents; reject malformed payloads before rendering them. */
export function assertDocument(value: unknown): asserts value is Document {
  if (!object(value) || !identity(value.id))
    throw new Error('Invalid document identity');
  let valid = false;
  switch (value.kind) {
    case 'list':
      valid = text(value.name);
      break;
    case 'row':
      valid =
        identity(value.listId) &&
        fields(value, [
          'name',
          'unit',
          'notes',
          'category',
          'store',
          'status',
        ]) &&
        (value.savedItemId === undefined || identity(value.savedItemId));
      break;
    case 'entry':
      valid =
        identity(value.rowId) &&
        typeof value.quantity === 'number' &&
        fields(value, [
          'unit',
          'sourceName',
          'sourceNotes',
          'sourceDate',
          'mealTag',
        ]) &&
        (value.sourceUnit === undefined || text(value.sourceUnit)) &&
        ['manual', 'recipe', 'scheduled', 'planned'].includes(
          String(value.origin)
        ) &&
        nullableId(value.sourceId) &&
        nullableId(value.mealId) &&
        (value.sourceId === null) === (value.mealId === null);
      break;
    case 'recipe':
    case 'meal':
      valid =
        text(value.name) &&
        Array.isArray(value.ingredients) &&
        value.ingredients.every(ingredient);
      if (value.kind === 'recipe')
        valid =
          valid &&
          (value.deleted === undefined || typeof value.deleted === 'boolean');
      if (value.kind === 'meal')
        valid =
          valid &&
          identity(value.listId) &&
          nullableId(value.recipeId) &&
          fields(value, ['date', 'mealTag']) &&
          typeof value.servings === 'number' &&
          (value.ingredients as Record<string, unknown>[]).every(
            i =>
              nullableId(i.recipeIngredientId) &&
              typeof i.selected === 'boolean' &&
              typeof i.overridden === 'boolean'
          );
      break;
  }
  if (!valid) throw new Error('Invalid saved quantity document');
}

export function assertOperation(value: unknown): asserts value is Operation {
  if (
    !object(value) ||
    !identity(value.id) ||
    !text(value.label) ||
    !strings(value.parents) ||
    !strings(value.resolves) ||
    !Array.isArray(value.changes) ||
    !Array.isArray(value.guards) ||
    (value.syncSavedItems !== undefined &&
      typeof value.syncSavedItems !== 'boolean')
  )
    throw new Error('Invalid saved operation');
  if (
    value.commit !== undefined &&
    (!object(value.commit) ||
      !Number.isSafeInteger(value.commit.sequence) ||
      (value.commit.sequence as number) < 1 ||
      !strings(value.commit.parents))
  )
    throw new Error('Invalid committed sequence');
  for (const change of value.changes) {
    if (!object(change) || !identity(change.id) || !nullableId(change.before))
      throw new Error('Invalid saved change');
    if (change.value !== null) assertDocument(change.value);
  }
  for (const guard of value.guards) {
    if (
      !object(guard) ||
      !(guard.kind === 'version'
        ? identity(guard.id) && identity(guard.version)
        : ((guard.kind === 'entries' && identity(guard.rowId)) ||
            (guard.kind === 'recipeMeals' && identity(guard.recipeId))) &&
          strings(guard.versions))
    )
      throw new Error('Invalid saved precondition');
  }
}
