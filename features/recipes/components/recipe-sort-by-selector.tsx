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

export type RecipeSortBy = 'name' | 'recent';

type RecipeSortBySelectorProps = {
  value?: RecipeSortBy;
  onChange: (value: RecipeSortBy) => void;
};

export const RecipeSortBySelector = ({
  value = 'recent',
  onChange,
}: RecipeSortBySelectorProps) => {
  const getDisplayLabel = (value: RecipeSortBy) => {
    switch (value) {
      case 'name':
        return 'Sort: Alphabetical';
      case 'recent':
        return 'Sort: Recent';
      default:
        return 'Sort: Recent';
    }
  };

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          hasValue={value !== 'recent'}
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
          <DropdownMenuItemTitle>Alphabetical</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          key="recent"
          value={value === 'recent' ? 'on' : 'off'}
          onValueChange={() => onChange('recent')}
        >
          <DropdownMenuItemTitle>Recent</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
