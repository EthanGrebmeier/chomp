import { View } from 'react-native';

import { SHEET_TOP_STYLE } from '@/components/sheet-content';
import { SheetHeader } from '@/components/sheet-header';
import { BackButton } from '@/components/ui/back-button';
import { AccountScreen } from '@/features/account/components/account-screen';

type AccountSettingsScreenProps = {
  onBack?: () => void;
};

export function AccountSettingsScreen({ onBack }: AccountSettingsScreenProps) {
  return (
    <View className="bg-background" style={SHEET_TOP_STYLE}>
      <SheetHeader
        title="Account"
        backAction={<BackButton onPress={onBack} href="/settings" />}
      />
      <AccountScreen />
    </View>
  );
}
