import { Rows3Icon } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { cn } from '../../../lib/utils';

type GroupBySelectorProps = {
  value?: 'category' | 'none' | 'recipe';
  onChange: (value: 'category' | 'none' | 'recipe') => void;
};

export const GroupBySelector = ({
  value = 'none',
  onChange,
}: GroupBySelectorProps) => {
  const getDisplayLabel = (value: 'category' | 'none' | 'recipe') => {
    switch (value) {
      case 'category':
        return 'Group by: Category';
      case 'recipe':
        return 'Group by: Recipe';
      case 'none':
        return 'Group by: None';
      default:
        return 'Group by: None';
    }
  };

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          icon={
            <Icon
              className={cn(
                value !== 'none' && 'text-accent-orange-foreground'
              )}
              as={Rows3Icon}
              size={16}
            />
          }
          className={cn(
            value !== 'none' &&
              'border-accent-orange-foreground bg-accent-orange-background '
          )}
          textClassName={cn(
            value !== 'none' && 'text-accent-orange-foreground'
          )}
        >
          {getDisplayLabel(value)}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          key="none"
          value={value === 'none' ? 'on' : 'off'}
          onValueChange={() => onChange('none')}
        >
          <DropdownMenuItemTitle>None</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          key="category"
          value={value === 'category' ? 'on' : 'off'}
          onValueChange={() => onChange('category')}
        >
          <DropdownMenuItemTitle>Category</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          key="recipe"
          value={value === 'recipe' ? 'on' : 'off'}
          onValueChange={() => onChange('recipe')}
        >
          <DropdownMenuItemTitle>Recipe</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
