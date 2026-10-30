import { Button, type ButtonProps } from './button';

/** Shared size for text actions at the bottom of a sheet, form, or screen.
 * Layout (full-width or paired) belongs to the parent; labels may grow vertically.
 */
export function BottomActionButton(props: Omit<ButtonProps, 'size'>) {
  return <Button {...props} size="bottom" />;
}
