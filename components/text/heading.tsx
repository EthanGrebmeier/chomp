import { Text } from '../ui/text';

export const Heading = ({ children }: { children: React.ReactNode }) => {
  return <Text className="text-4xl font-bold text-foreground">{children}</Text>;
};
