import { BookOpen, CalendarDays, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { type Contribution, contributionSourceDetail } from './model';

/** Provenance lives below the source name and ingredient note, not in either. */
export function SourceDetails({ entry }: { entry: Contribution }) {
  const sourceIcon =
    entry.origin === 'scheduled' || entry.origin === 'planned'
      ? CalendarDays
      : entry.origin === 'recipe'
        ? BookOpen
        : Plus;

  return (
    <View className="flex-row items-start gap-1.5">
      <Icon
        as={sourceIcon}
        size={14}
        className="mt-0.5 text-muted-foreground"
      />
      <Text className="flex-1 text-sm text-muted-foreground">
        {contributionSourceDetail(entry)}
      </Text>
    </View>
  );
}
