import { View } from 'react-native';

import { Button } from '../../../../components/ui/button';
import { Text } from '../../../../components/ui/text';

import { useAddItem } from './useAddItem';

const BottomBar = () => {
  const { addItem } = useAddItem();
  return (
    <View className="flex-row items-center justify-between border-t border-dashed border-border pt-3">
      <Text> My List </Text>
      <Button variant="default" onPress={addItem}>
        <Text>Create</Text>
      </Button>
    </View>
  );
};

export default BottomBar;
