import { View } from 'react-native';

import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
import { useItemSheet } from '../use-item-sheet';

const AddItemBottomBar = () => {
  const { onSubmit: addItem } = useItemSheet();
  return (
    <View className="flex-row items-center justify-between border-t border-dashed border-border pt-3">
      <Text> My List </Text>
      <Button variant="default" onPress={addItem}>
        <Text>Create</Text>
      </Button>
    </View>
  );
};

export default AddItemBottomBar;
