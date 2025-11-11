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
import { cn } from '../../../lib/utils';

type SortBySelectorProps = {
  value?: 'name' | 'recent';
  onChange: (value: 'name' | 'recent') => void;
};

export const SortBySelector = ({
  value = 'recent',
  onChange,
}: SortBySelectorProps) => {
  const getDisplayLabel = (value: 'name' | 'recent') => {
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
          icon={
            <Icon
              className={cn(
                value !== 'recent' && 'text-accent-purple-foreground'
              )}
              as={ArrowDownUpIcon}
              size={16}
            />
          }
          className={cn(
            value !== 'recent' &&
              'border-accent-purple-foreground bg-accent-purple-background '
          )}
          textClassName={cn(
            value !== 'recent' && 'text-accent-purple-foreground'
          )}
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
