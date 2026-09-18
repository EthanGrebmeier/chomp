import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

import { RecipeParseError } from '../../api/parse-recipe-url';
import { getImportErrorPresentation } from '../../constants/import-errors';

type ImportErrorProps = {
  error: RecipeParseError;
};

export function ImportError({ error }: ImportErrorProps) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  const {
    title,
    hint,
    icon: IconComponent,
  } = getImportErrorPresentation(error.code);

  const rateLimitReset = error.rateLimitInfo?.resetSeconds;
  const showRateLimitInfo = error.code === 'rate_limited' && !!rateLimitReset;

  return (
    <View className="items-center py-6">
      <View className="mb-4 rounded-full bg-destructive/10 p-4">
        <IconComponent size={32} color={theme.destructive} />
      </View>

      <Text className="mb-2 text-center text-lg font-semibold text-foreground">
        {title}
      </Text>

      {hint ? (
        <Text className="text-center text-sm text-muted-foreground">
          {hint}
        </Text>
      ) : null}

      {showRateLimitInfo ? (
        <View className="mt-4 rounded-lg bg-muted/50 px-4 py-2">
          <Text
            tabularNumbers
            className="text-center text-sm text-muted-foreground"
          >
            Try again in {rateLimitReset} seconds
          </Text>
        </View>
      ) : null}
    </View>
  );
}
