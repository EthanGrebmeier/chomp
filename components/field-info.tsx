import { AnyFieldApi } from '@tanstack/react-form';

import { Text } from './ui/text';

export const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  return (
    field.state.meta.isTouched &&
    !field.state.meta.isValid && (
      <Text className="text-sm text-red-500">
        {field.state.meta.errors.join(', ')}
      </Text>
    )
  );
};
