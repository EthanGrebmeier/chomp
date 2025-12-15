import { ItemInput } from './item-input';
import { NotesInput } from './notes-input';
import { RecipeTag } from './recipe-tag';

export const ItemForm = () => {
  return (
    <>
      <ItemInput placeholder="Add Item" />
      <RecipeTag />
      <NotesInput />
    </>
  );
};
