import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

type ImportLoadingProps = {
  url: string;
  onCancel: () => void;
};

/**
 * Elapsed-time thresholds (ms) at which the status copy advances. Roughly
 * mirrors the server pipeline: fetch page → AI extraction → still waiting.
 */
const STAGES: { afterMs: number; title: string; hint?: string }[] = [
  { afterMs: 0, title: 'Fetching the page…' },
  { afterMs: 4_000, title: 'Reading the ingredients…' },
  {
    afterMs: 12_000,
    title: 'Still working…',
    hint: 'Some recipe sites are slow to respond. This can take up to a minute.',
  },
];

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const useElapsedStage = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.afterMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return STAGES[stageIndex];
};

export const ImportLoading = ({ url, onCancel }: ImportLoadingProps) => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const stage = useElapsedStage();

  return (
    <View className="items-center gap-6 py-12">
      <ActivityIndicator size="large" color={theme.primary} />

      <View className="items-center gap-1 px-4">
        <Text className="text-center text-base font-medium text-foreground">
          {stage.title}
        </Text>
        <Text
          className="text-center text-sm text-muted-foreground"
          numberOfLines={1}
        >
          {getHostname(url)}
        </Text>
        {stage.hint ? (
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            {stage.hint}
          </Text>
        ) : null}
      </View>

      <Button variant="outline" onPress={onCancel}>
        <Text>Cancel</Text>
      </Button>
    </View>
  );
};
