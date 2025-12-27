import { TrueSheet } from '@lodev09/react-native-true-sheet';
import * as Clipboard from 'expo-clipboard';
import { CopyIcon, ShareIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Share, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { buildListDeepLinkUrl } from '../../../lib/navigation';

export type ShareListSheetRef = {
  present: (joinCode: string) => void;
  dismiss: () => void;
};

export const ShareListSheet = forwardRef<ShareListSheetRef, object>(
  (_, ref) => {
    const sheetRef = useRef<TrueSheet>(null);
    const [joinCode, setJoinCode] = useState('');

    useImperativeHandle(ref, () => ({
      present: (code: string) => {
        setJoinCode(code);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleCopyCode = async () => {
      await Clipboard.setStringAsync(joinCode);
      toast.success('Code copied to clipboard');
    };

    const handleCopyLink = async () => {
      const deepLinkUrl = buildListDeepLinkUrl(joinCode);
      await Clipboard.setStringAsync(deepLinkUrl);
      toast.success('Link copied to clipboard');
    };

    const handleShareLink = async () => {
      try {
        const deepLinkUrl = buildListDeepLinkUrl(joinCode);
        const result = await Share.share({
          message: `Join my grocery list: ${deepLinkUrl}`,
        });

        if (result.action === Share.sharedAction) {
          // Content was shared
          toast.success('Invite link shared');
        }
      } catch (error) {
        toast.error('Failed to share invite link');
        console.error('Error sharing:', error);
      }
    };

    return (
      <BottomSheet name="share-list-sheet" ref={sheetRef}>
        <BottomSheet.SheetView>
          <BottomSheet.Header className="mb-2" title="Share List" />
          <BottomSheet.Subtext>
            Others can use this code to join your list
          </BottomSheet.Subtext>
          <View className="mt-6 items-center gap-4">
            <HapticPressable
              hapticType="selection"
              onPress={handleCopyCode}
              className="flex-row items-center gap-3 rounded-2xl bg-muted px-6 py-4 active:opacity-70"
            >
              <Text className="font-mono text-2xl font-bold tracking-widest">
                {joinCode}
              </Text>
              <Icon as={CopyIcon} size={20} className="text-muted-foreground" />
            </HapticPressable>

            <Text className="text-center text-sm text-muted-foreground">
              Tap to copy code
            </Text>

            <View className="mt-4 w-full gap-3">
              <Button onPress={handleShareLink} className="w-full">
                <Icon as={ShareIcon} size={20} />
                <Text>Share Invite Link</Text>
              </Button>
            </View>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

ShareListSheet.displayName = 'ShareListSheet';
