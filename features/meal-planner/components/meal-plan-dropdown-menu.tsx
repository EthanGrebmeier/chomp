import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { addDays, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { MoreHorizontalIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { toast } from 'sonner-native';

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Icon } from '../../../components/ui/icon';
import {
  SelectGroceryListSheet,
  SelectGroceryListSheetRef,
} from '../../../features/grocery-lists/components/select-grocery-list-sheet';
import { useGroceryLists } from '../../../features/grocery-lists/instant/useGroceryLists';
import { useTheme } from '../../../hooks/use-theme';
import { navigation } from '../../../lib/navigation';
import { useAddMealPlanToGroceryList } from '../hooks/useAddMealPlanToGroceryList';
import { useCreateMealPlan } from '../hooks/useCreateMealPlan';
import { useDeleteMealPlan } from '../hooks/useDeleteMealPlan';

type MealPlanDropdownMenuProps = {
  mealPlanId: string;
  mealPlanName: string;
  listId?: string;
};

export const MealPlanDropdownMenu = ({
  mealPlanId,
  mealPlanName,
  listId,
}: MealPlanDropdownMenuProps) => {
  const selectListSheetRef = useRef<SelectGroceryListSheetRef>(null);

  const { data: groceryLists } = useGroceryLists();
  const { mutate: deleteMealPlan } = useDeleteMealPlan();
  const { mutate: createMealPlan } = useCreateMealPlan();
  const { mutate: addMealPlanToGroceryList } = useAddMealPlanToGroceryList();
  const theme = useTheme();

  const handleDelete = () => {
    deleteMealPlan(mealPlanId, {
      onSuccess: () => {
        toast.success(`${mealPlanName} deleted`);
      },
      onError: () => {
        toast.error('Failed to delete meal plan');
      },
    });
  };

  const handleCreateNewMealPlan = () => {
    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, 6);
    createMealPlan(
      {
        mealPlan: {
          name: 'New Meal Plan',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('New meal plan created');
        },
        onError: () => {
          toast.error('Failed to create meal plan');
        },
      }
    );
  };

  const performAddToGroceryList = (targetListId: string) => {
    addMealPlanToGroceryList(
      {
        mealPlanId,
        listId: targetListId,
      },
      {
        onSuccess: () => {
          router.push(navigation.goToList(targetListId));
          toast.success('Meal plan added to grocery list');
        },
        onError: () => {
          toast.error('Failed to add meal plan to grocery list');
        },
      }
    );
  };

  const handleAddToGroceryList = () => {
    // If listId prop provided, use it directly
    if (listId) {
      performAddToGroceryList(listId);
      return;
    }

    const lists = groceryLists?.grocery_lists ?? [];

    // If only one list, add directly to it
    if (lists.length === 1) {
      performAddToGroceryList(lists[0].id);
      return;
    }

    // Multiple lists (or none) - show selection sheet
    selectListSheetRef.current?.present();
  };

  const handleListSelected = (selectedListId: string) => {
    performAddToGroceryList(selectedListId);
  };

  return (
    <>
      <DropdownMenuRoot
        trigger={
          <Icon as={MoreHorizontalIcon} size={24} color={theme.foreground} />
        }
      >
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={handleCreateNewMealPlan}
              key="create-new-meal-plan"
            >
              <DropdownMenuItemTitle>
                Create New Meal Plan
              </DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'plus' }} />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleAddToGroceryList}
              key="add-to-grocery-list"
            >
              <DropdownMenuItemTitle>Add to Grocery List</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'cart' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() =>
                TrueSheet.present('meal-planner-start-date-sheet')
              }
              key="start-date"
            >
              <DropdownMenuItemTitle>Change Start Date</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'calendar' }} />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => TrueSheet.present('meal-planner-end-date-sheet')}
              key="end-date"
            >
              <DropdownMenuItemTitle>Change End Date</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'calendar' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleDelete} destructive key="delete">
              <DropdownMenuItemTitle>Delete Meal Plan</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'trash' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenuRoot>
      <SelectGroceryListSheet
        ref={selectListSheetRef}
        selectedListId={undefined}
        onSelectList={handleListSelected}
      />
    </>
  );
};
