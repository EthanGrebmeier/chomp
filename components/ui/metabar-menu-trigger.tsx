import { MoreHorizontal } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from './icon';
import { Pill } from './pill';

/** Native dropdown owns interaction; this chip supplies its accessible target. */
export function MetabarMenuTrigger({
  accessibilityLabel,
  active = false,
}: {
  accessibilityLabel: string;
  active?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="min-h-11 min-w-11 justify-center"
    >
      <Pill
        className={
          active
            ? 'min-w-11 justify-center bg-primary py-1.5'
            : 'min-w-11 justify-center py-1.5'
        }
        icon={
          <Icon
            as={MoreHorizontal}
            size={16}
            className={
              active ? 'text-primary-foreground' : 'text-muted-foreground'
            }
          />
        }
      />
    </View>
  );
}
