export const formatQuantity = ({
  quantity,
  unit,
}: {
  quantity: number;
  unit: string;
}) => {
  if (unit === 'each') {
    return `x${quantity}`;
  }
  return `${quantity} ${unit}`;
};
