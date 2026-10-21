import { OptionDropdown } from '@/components/item-sheet/option-dropdown';
import { MetaBarLayout } from '@/components/meta-bar-layout';
import { ScrollingMetaBar } from '@/components/scrolling-meta-bar';
import { Pill } from '@/components/ui/pill';
import { categoryOptions } from '@/features/shared/category/categories';
import {
  getCategoryTextClassName,
  getCategorySurfaceClassName,
} from '@/features/shared/category/category-colors';
import { cn } from '@/lib/utils';

import { type DemoItem } from './model';

/** Same metadata primitives as MetaBar, without the live create-store/category paths. */
export function DemoMetaBar({
  item,
  onChange,
}: {
  item: DemoItem;
  onChange: (item: DemoItem) => void;
}) {
  const category = categoryOptions.find(
    option => option.value === (item.category ?? 'produce')
  );
  const hasStore = item.store !== 'No store';
  const disabled = item.status !== 'active' || !item.name.trim();

  return (
    <>
      <MetaBarLayout>
        <ScrollingMetaBar>
          <OptionDropdown
            label="category"
            disabled={disabled}
            value={item.category ?? 'produce'}
            options={categoryOptions}
            onSelect={value => onChange({ ...item, category: value ?? '' })}
          >
            <Pill
              hasValue={!!category}
              className={
                category
                  ? getCategorySurfaceClassName(category.color)
                  : undefined
              }
              textClassName={
                category ? getCategoryTextClassName(category.color) : undefined
              }
            >
              {category?.label ?? 'Category'}
            </Pill>
          </OptionDropdown>
          <OptionDropdown
            label="store"
            disabled={disabled}
            value={hasStore ? item.store : undefined}
            options={['Whole Foods', 'Farmers market'].map(value => ({
              value,
              label: value,
            }))}
            onSelect={value =>
              onChange({ ...item, store: value ?? 'No store' })
            }
          >
            <Pill
              hasValue={hasStore}
              textClassName={cn(
                'font-semibold',
                hasStore ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {hasStore ? item.store : 'Store'}
            </Pill>
          </OptionDropdown>
        </ScrollingMetaBar>
      </MetaBarLayout>
    </>
  );
}
