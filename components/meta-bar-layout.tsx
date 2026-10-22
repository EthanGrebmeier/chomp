import { View } from 'react-native';

type MetaBarLayoutProps = {
  children: React.ReactNode;
  action?: React.ReactNode;
};

export const MetaBarLayout = ({ children, action }: MetaBarLayoutProps) => {
  return (
    <View>
      {children}
      {action && <View className="mt-3">{action}</View>}
    </View>
  );
};
