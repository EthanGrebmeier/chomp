import { createContext, useContext, useState } from 'react';

import { AppQuantityItemSheet } from '@/features/quantity/app/item-sheet';

import { GroceryListItemWithRecipe } from '../../../features/grocery-list/types';

type EditItemContextType = {
  present: (item: GroceryListItemWithRecipe) => void;
  dismiss: () => void;
};

const EditItemContext = createContext<EditItemContextType | null>(null);

export const useEditItemSheet = () => {
  const context = useContext(EditItemContext);
  if (!context) {
    throw new Error('useEditItemSheet must be used within an EditItemProvider');
  }
  return context;
};

type EditItemProps = {
  groceryListId: string;
  /** Opens the meal plan view on `date` (`yyyy-MM-dd`). */
  onOpenMealPlanDate?: (
    date: string,
    mealId?: string,
    sourceId?: string
  ) => void;
  children: React.ReactNode;
};

function QuantityEditItemProvider({
  groceryListId,
  onOpenMealPlanDate,
  children,
}: EditItemProps) {
  const [itemId, setItemId] = useState<string | null>(null);
  return (
    <EditItemContext.Provider
      value={{
        present: item => setItemId(item.id),
        dismiss: () => setItemId(null),
      }}
    >
      {children}
      {itemId ? (
        <AppQuantityItemSheet
          key={`${groceryListId}:${itemId}`}
          listId={groceryListId}
          rowId={itemId}
          onDismiss={() => setItemId(null)}
          onOpenMealPlanDate={onOpenMealPlanDate}
        />
      ) : null}
    </EditItemContext.Provider>
  );
}
export default QuantityEditItemProvider;
