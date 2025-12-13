import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
export const WithLayoutTransition = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.bezier(0.25, 0.1, 0.25, 1.0))}
    >
      {children}
    </Animated.View>
  );
};
