import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRef } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { BottomSheet } from '../components/bottom-sheet';
import { Button } from '../components/ui/button';

export const Test = () => {
  const ref = useRef<TrueSheet>(null);
  return (
    <View className="pt-safe flex-1">
      <Button onPress={() => ref.current?.present()}>
        <Text>Open</Text>
      </Button>
      <BottomSheet ref={ref}>
        <Text>Test</Text>
      </BottomSheet>
    </View>
  );
};

export default Test;
