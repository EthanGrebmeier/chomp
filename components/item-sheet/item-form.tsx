import { ItemInput } from './item-input';
import { NotesInput } from './notes-input';
import { RecipeTag } from './recipe-tag';
import { useItemSheet } from './use-item-sheet';

export const ItemForm = () => {
  const { recipe } = useItemSheet();

  return (
    <>
      <ItemInput placeholder="Add Item" />
      {recipe && <RecipeTag />}
      <NotesInput />
    </>
  );
};
