import { View } from 'react-native';

type MetaBarLayoutProps = {
  children: React.ReactNode;
  action: React.ReactNode;
};

export const MetaBarLayout = ({ children, action }: MetaBarLayoutProps) => {
  return (
    <View>
      {children}
      <View className="mt-3 pt-3 border-t border-border border-dashed">{action}</View>
    </View>
  );
};
