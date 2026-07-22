import { ListFilter } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { RecipeSortOption } from '../utils/filter-recipes';

type RecipeFilterDropdownMenuProps = {
  mealTag?: string;
  sortBy: RecipeSortOption;
  onMealTagChange: (value?: string) => void;
  onSortByChange: (value: RecipeSortOption) => void;
};

const mealTagOptions = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
] as const;

export const RecipeFilterDropdownMenu = ({
  mealTag,
  sortBy,
  onMealTagChange,
  onSortByChange,
}: RecipeFilterDropdownMenuProps) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Icon as={ListFilter} size={24} hitSlop={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger key="sort-by-submenu">
            <DropdownMenuItemTitle>Sort By</DropdownMenuItemTitle>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              key="sort-recently-added"
              value={sortBy === 'recent' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('recent')}
            >
              <DropdownMenuItemTitle>
                Recently Added to List
              </DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="sort-name"
              value={sortBy === 'name' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('name')}
            >
              <DropdownMenuItemTitle>Alphabetical</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger key="filter-by-meal-submenu">
            <DropdownMenuItemTitle>Filter By Meal</DropdownMenuItemTitle>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              key="meal-all"
              value={!mealTag ? 'on' : 'off'}
              onValueChange={() => onMealTagChange(undefined)}
            >
              <DropdownMenuItemTitle>All</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            {mealTagOptions.map(option => (
              <DropdownMenuCheckboxItem
                key={`meal-${option.toLowerCase()}`}
                value={mealTag === option ? 'on' : 'off'}
                onValueChange={() => onMealTagChange(option)}
              >
                <DropdownMenuItemTitle>{option}</DropdownMenuItemTitle>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
