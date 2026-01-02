import { ArrowDownUpIcon } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';

type SortBySelectorProps = {
  value?: 'name' | 'category';
  onChange: (value: 'name' | 'category') => void;
};

export const SortBySelector = ({
  value = 'name',
  onChange,
}: SortBySelectorProps) => {
  const getDisplayLabel = (value: 'name' | 'category') => {
    switch (value) {
      case 'name':
        return 'Sort: A-Z';
      case 'category':
        return 'Sort: Category';
      default:
        return 'Sort: A-Z';
    }
  };

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          hasValue={value !== 'name'}
          textClassName="text-muted-foreground"
          icon={
            <Icon
              className="text-muted-foreground"
              as={ArrowDownUpIcon}
              size={16}
            />
          }
        >
          {getDisplayLabel(value)}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          key="name"
          value={value === 'name' ? 'on' : 'off'}
          onValueChange={() => onChange('name')}
        >
          <DropdownMenuItemTitle>Alphabetical (A-Z)</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          key="category"
          value={value === 'category' ? 'on' : 'off'}
          onValueChange={() => onChange('category')}
        >
          <DropdownMenuItemTitle>Category</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
