import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

type MealPlanRecipeTitleProps = {
  name: string;
  className?: string;
};

export const MealPlanRecipeTitle = ({
  name,
  className,
}: MealPlanRecipeTitleProps) => {
  return (
    <Text
      className={cn(
        'text-2xl font-medium leading-tight text-foreground',
        className
      )}
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {name}
    </Text>
  );
};
