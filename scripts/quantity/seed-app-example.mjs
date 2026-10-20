// Opt-in fixture for a guest-created, empty *real* grocery list. No reset/delete.
import { randomUUID as uuid } from 'node:crypto';
import { testApp, names } from './test-app.mjs';
const { db } = testApp();
const result = await db.query({
  grocery_lists: {
    $: { where: { name: 'Quantity test' } },
    owner: {},
    grocery_items: {},
  },
});
if (result.grocery_lists.length !== 1)
  throw new Error(
    'Create one empty Quantity test list as a guest in the simulator first'
  );
const list = result.grocery_lists[0];
const owner = Array.isArray(list.owner) ? list.owner[0] : list.owner;
if (!owner || owner.email || list.grocery_items.length)
  throw new Error('Fixture requires an empty guest-owned list');
const saved = await db.query({
  [names.operations]: { $: { where: { workspaceId: list.id } } },
});
const history = saved[names.operations].map(row => JSON.parse(row.body));
if (
  history.length !== 1 ||
  history[0].changes.some(c => c.value?.kind !== 'list')
)
  throw new Error('List already contains quantity data; refusing to reseed');
const now = new Date().toISOString();
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
}).format(new Date());
const pieId = uuid(),
  butterId = uuid(),
  pieIngredientId = uuid(),
  butterIngredientId = uuid();
const mealId = uuid(),
  sourceId = uuid(),
  rowId = uuid(),
  gramsId = uuid();
const ingredient = (id, quantity, unit = 'each') => ({
  id,
  name: 'Apples',
  quantity,
  unit,
  notes: '',
  category: 'produce',
  store: '',
});
const pie = {
  kind: 'recipe',
  id: pieId,
  name: 'Apple pie',
  ingredients: [ingredient(pieIngredientId, 2)],
};
const butter = {
  kind: 'recipe',
  id: butterId,
  name: 'Apple butter',
  ingredients: [ingredient(butterIngredientId, 1)],
};
const row = (id, unit) => ({
  kind: 'row',
  id,
  listId: list.id,
  name: 'Apples',
  unit,
  notes: '',
  category: 'produce',
  store: '',
  status: 'active',
  createdAt: now,
});
const entry = (
  rowId,
  quantity,
  origin,
  sourceName,
  sourceId = null,
  unit = 'each'
) => ({
  kind: 'entry',
  id: uuid(),
  rowId,
  quantity,
  unit,
  sourceUnit: unit,
  origin,
  sourceName,
  sourceNotes: '',
  sourceDate: sourceId ? date : '',
  mealTag: sourceId ? 'Dinner' : '',
  sourceId,
  mealId: sourceId ? mealId : null,
});
const documents = [
  pie,
  butter,
  row(rowId, 'each'),
  row(gramsId, 'g'),
  {
    kind: 'meal',
    id: mealId,
    listId: list.id,
    name: pie.name,
    recipeId: pie.id,
    date,
    mealTag: 'Dinner',
    servings: 1,
    ingredients: [
      {
        ...ingredient(sourceId, 2),
        recipeIngredientId: pieIngredientId,
        selected: true,
        overridden: false,
      },
    ],
  },
  entry(rowId, 2, 'scheduled', 'Apple pie', sourceId),
  entry(rowId, 1, 'recipe', 'Apple butter'),
  entry(rowId, 2, 'manual', ''),
  entry(gramsId, 500, 'manual', '', null, 'g'),
];
const operation = {
  id: uuid(),
  parents: [history[0].id],
  label: 'Add Apples quantity example',
  guards: [{ kind: 'version', id: list.id, version: history[0].id }],
  resolves: [],
  changes: documents.map(value => ({ id: value.id, before: null, value })),
};
await db.transact([
  ...[pie, butter].flatMap(recipe => [
    db.tx.recipes[recipe.id]
      .update({
        name: recipe.name,
        description: 'Quantity model test recipe',
        imageSrc: '',
        visibility: 'private',
        createdAt: now,
        updatedAt: now,
      })
      .link({ user: list.ownerId }),
    ...recipe.ingredients.map(({ store: _store, ...i }) =>
      db.tx.recipe_ingredients[i.id].update(i).link({ recipe: recipe.id })
    ),
  ]),
  db.tx[names.operations][operation.id]
    .update({
      workspaceId: list.id,
      authorId: list.ownerId,
      body: JSON.stringify(operation),
    })
    .link({ workspace: list.id }),
]);
console.log(
  JSON.stringify({
    listId: list.id,
    mealId,
    sourceId,
    rowId,
    gramsId,
    pieId,
    butterId,
  })
);
