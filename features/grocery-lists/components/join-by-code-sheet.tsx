import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { useJoinGroceryListByCode } from '../instant/useJoinGroceryListByCode';

export type JoinByCodeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type JoinByCodeSheetProps = {
  onJoined: (listId: string) => void;
};

export const JoinByCodeSheet = forwardRef<JoinByCodeSheetRef, JoinByCodeSheetProps>(
  ({ onJoined }, ref) => {
    const sheetRef = useRef<TrueSheet>(null);
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const joinGroceryListByCode = useJoinGroceryListByCode();

    useImperativeHandle(ref, () => ({
      present: () => {
        sheetRef.current?.present();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleJoinByCode = async () => {
      if (joinCode.length !== 8) {
        toast.error('Join code must be 8 characters');
        return;
      }

      setIsLoading(true);
      try {
        const result = await joinGroceryListByCode(joinCode);
        if (result.success) {
          toast.success(`Joined "${result.listName}"`);
          onJoined(result.listId);
          setJoinCode('');
          sheetRef.current?.dismiss();
        } else {
          toast.error(result.error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleCancel = () => {
      setJoinCode('');
      sheetRef.current?.dismiss();
    };

    return (
      <BottomSheet
        name="join-by-code-sheet"
        ref={sheetRef}
        onStartClose={() => {
          KeyboardController.dismiss();
          setJoinCode('');
        }}
      >
        <BottomSheet.Header title="Join by Code" />

        <View className="mt-6 gap-4">
          <Text className="text-center text-muted-foreground">
            Enter the 8-character code to join a shared list
          </Text>
          <TextInput
            ref={inputRef}
            value={joinCode}
            onChangeText={text => setJoinCode(text.slice(0, 8))}
            placeholder="Enter 8-character code"
            placeholderTextColor="#9ca3af"
            className="h-12 rounded-xl border border-input bg-input px-4 text-center font-mono text-lg tracking-widest text-foreground"
            onSubmitEditing={handleJoinByCode}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={8}
          />
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text>Cancel</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={handleJoinByCode}
              disabled={joinCode.length !== 8 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text>Join</Text>
              )}
            </Button>
          </View>
        </View>
      </BottomSheet>
    );
  }
);

JoinByCodeSheet.displayName = 'JoinByCodeSheet';

