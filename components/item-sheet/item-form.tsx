import { ItemInput } from './item-input';
import { NotesInput } from './notes-input';

export const ItemForm = () => {
  return (
    <>
      <ItemInput placeholder="Add Item" />
      <NotesInput />
    </>
  );
};
