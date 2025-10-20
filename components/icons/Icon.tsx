import { Icon as LucideIcon } from 'lucide-react-native';
import { ComponentProps } from 'react';
import { useTheme } from '../../hooks/use-theme';

const Icon = ({
  iconNode,
  color: colorProp,
  ...props
}: ComponentProps<typeof LucideIcon>) => {
  const theme = useTheme();
  const color = colorProp ?? theme.foreground;
  return <LucideIcon iconNode={iconNode} color={color} {...props} />;
};

export { Icon };
