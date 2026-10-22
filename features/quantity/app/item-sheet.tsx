import { id } from '@instantdb/react-native';
import { toast } from 'sonner-native';

import { CategorySheet } from '@/components/item-sheet/category-sheet';
import { StoreSheet } from '@/components/item-sheet/store-sheet';
import { ScrollingMetaBar } from '@/components/scrolling-meta-bar';
import { db } from '@/lib/instant';

import { ItemSheet } from '../components/item-sheet';
import { record } from '../model';

import { moveQuantityRows } from './grocery-actions';
import { useQuantityList } from './session';

export function AppQuantityItemSheet({
  listId,
  rowId,
  onDismiss,
  onOpenMealPlanDate,
}: {
  listId: string;
  rowId: string;
  onDismiss: () => void;
  onOpenMealPlanDate?: (
    date: string,
    mealId?: string,
    sourceId?: string
  ) => void;
}) {
  const session = useQuantityList(listId);
  const { data } = db.useQuery({ grocery_lists: {} });
  if (!session.state.documents[rowId]) return null;
  return (
    <ItemSheet
      state={session.state}
      rowId={rowId}
      newId={id}
      send={operation => session.send({ ...operation, syncSavedItems: true })}
      onDismiss={onDismiss}
      lists={data?.grocery_lists}
      MetadataComponent={AppMetadataBar}
      onOpenMeal={(mealId, sourceId) => {
        const meal = record(session.state, mealId, 'meal');
        onOpenMealPlanDate?.(meal.date, mealId, sourceId);
      }}
      onMove={(itemId, destination) => {
        void moveQuantityRows([itemId], destination).catch(e =>
          toast.error(String(e))
        );
      }}
    />
  );
}

function AppMetadataBar({
  row,
  onChange,
  children,
}: {
  children?: React.ReactNode;
  row: import('../types').ShoppingRow;
  onChange: (
    details: Parameters<typeof import('../shopping').editShoppingDetails>[3]
  ) => Promise<void>;
}) {
  const { data } = db.useQuery({ stores: {} });
  return (
    <ScrollingMetaBar contentClassName="gap-3">
      <CategorySheet
        category={row.category}
        onSelect={value => {
          void onChange({ category: value ?? '' }).catch(e =>
            toast.error(String(e))
          );
        }}
      />
      <StoreSheet
        storeId={row.store}
        storeName={data?.stores.find(s => s.id === row.store)?.name}
        onSelect={store => {
          void onChange({ store: store ?? '' }).catch(e =>
            toast.error(String(e))
          );
        }}
      />
      {children}
    </ScrollingMetaBar>
  );
}
