import { Text } from './ui/text';

type CategoryTagProps = {
  category: string;
};

export const CategoryTag = ({ category }: CategoryTagProps) => {
  return (
    <Text className="rounded-full bg-muted px-2 py-1 text-sm text-muted-foreground">
      {category}
    </Text>
  );
};
