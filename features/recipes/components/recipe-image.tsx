import { Image } from 'expo-image';
import { CameraIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';

type RecipeImageProps = {
  imageSrc: string | null;
  onSelectImage: () => void;
};

const RecipeImage = ({ imageSrc, onSelectImage }: RecipeImageProps) => {
  return (
    <HapticPressable
      onPress={onSelectImage}
      className="size-32 overflow-hidden rounded-xl bg-muted"
    >
      {imageSrc ? (
        <Image
          source={{ uri: imageSrc }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : (
        <View className="size-full items-center justify-center">
          <Icon as={CameraIcon} size={24} />
        </View>
      )}
    </HapticPressable>
  );
};

export default RecipeImage;
