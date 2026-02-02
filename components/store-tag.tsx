import { cn } from '../lib/utils';

import { Pill } from './ui/pill';
import { Text } from './ui/text';

type StoreTagProps = {
  name: string;
};

export const StoreTag = ({ name }: StoreTagProps) => {
  if (!name) {
    return null;
  }

  return (
    <Pill className={cn('border border-border py-0.5')} hasValue={true}>
      <Text className="text-xs font-semibold text-muted-foreground">
        {name}
      </Text>
    </Pill>
  );
};
