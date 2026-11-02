export const incrementGroceryListItem = async ({
  itemId,
  quantityToAdd,
}: {
  itemId: string;
  quantityToAdd: number;
}) => {
  const { addExtraQuantity } =
    await import('@/features/quantity/app/grocery-actions');
  return addExtraQuantity(itemId, quantityToAdd);
};
