import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { addDays, startOfDay } from 'date-fns';
import { MoreHorizontalIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { toast } from 'sonner-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { Icon } from '../../../components/ui/icon';
import { useTheme } from '../../../hooks/use-theme';
import { useAddMealPlanToGroceryList } from '../hooks/useAddMealPlanToGroceryList';
import { useCreateMealPlan } from '../hooks/useCreateMealPlan';
import { useDeleteMealPlan } from '../hooks/useDeleteMealPlan';

type MealPlanDropdownMenuProps = {
  mealPlanId: string;
  mealPlanName: string;
};

export const MealPlanDropdownMenu = ({
  mealPlanId,
  mealPlanName,
}: MealPlanDropdownMenuProps) => {
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

  const handleAddToGroceryList = () => {
    addMealPlanToGroceryList(
      {
        mealPlanId: mealPlanId,
      },
      {
        onSuccess: () => {
          toast.success('Meal plan added to grocery list');
        },
        onError: () => {
          toast.error('Failed to add meal plan to grocery list');
        },
      }
    );
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Pressable className="p-2">
          <Icon as={MoreHorizontalIcon} size={24} color={theme.foreground} />
        </Pressable>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Item
            onSelect={handleCreateNewMealPlan}
            key="create-new-meal-plan"
          >
            <DropdownMenu.ItemTitle>
              Create New Meal Plan
            </DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'plus' }} />
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleAddToGroceryList}
            key="add-to-grocery-list"
          >
            <DropdownMenu.ItemTitle>Add to Grocery List</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'cart' }} />
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Group>
          <DropdownMenu.Item
            onSelect={() => TrueSheet.present('meal-planner-start-date-sheet')}
            key="start-date"
          >
            <DropdownMenu.ItemTitle>Change Start Date</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'calendar' }} />
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => TrueSheet.present('meal-planner-end-date-sheet')}
            key="end-date"
          >
            <DropdownMenu.ItemTitle>Change End Date</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'calendar' }} />
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Group>
          <DropdownMenu.Item onSelect={handleDelete} destructive key="delete">
            <DropdownMenu.ItemTitle>Delete Meal Plan</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
