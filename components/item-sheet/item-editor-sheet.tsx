import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ArrowUpIcon, CheckIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

import { ItemComposerCard } from './item-composer-card';
import { ItemForm } from './item-form';
import { ItemSuggestions } from './item-suggestions';
import { MetaBar } from './meta-bar';
import { useItemSheet } from './use-item-sheet';

/** Shared compact editor for item forms; persistence stays with each caller. */
export function ItemEditorSheet({
  sheetRef,
  name,
  title,
  source,
  metadata,
  actionLabel,
  onStartClose,
  onDismiss,
  showNotes = true,
  savedItemActions = false,
}: {
  sheetRef: React.RefObject<TrueSheet | null>;
  name: string;
  title: string;
  source?: ReactNode;
  metadata?: ReactNode;
  actionLabel?: string;
  onStartClose?: () => void;
  onDismiss?: () => void;
  showNotes?: boolean;
  savedItemActions?: boolean;
}) {
  const {
    itemInputRef,
    disableAutocomplete,
    onSubmit,
    isValid,
    isSubmitting,
    mode,
  } = useItemSheet();
  const close = () => {
    void sheetRef.current?.dismiss();
  };
  const focus = () => itemInputRef.current?.focus();
  return (
    <TrueSheet
      ref={sheetRef}
      name={name}
      detents={['auto']}
      draggable={false}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}
      elevation={0}
      insetAdjustment="never"
      onWillPresent={focus}
      onWillFocus={focus}
      onWillDismiss={onStartClose}
      onDidDismiss={onDismiss}
    >
      <ItemForm
        compact
        source={source}
        showNotes={showNotes}
        renderContent={(fields, suggestions) => (
          <View className="px-2" style={{ paddingBottom: 24 }}>
            {!disableAutocomplete ? (
              <ItemSuggestions
                onClose={close}
                label={`Close ${title.toLowerCase()}`}
              >
                {suggestions}
              </ItemSuggestions>
            ) : null}
            <ItemComposerCard
              title={title}
              onClose={close}
              metadata={
                metadata ?? (
                  <MetaBar savedItemActionsInMenu={savedItemActions} />
                )
              }
              action={
                actionLabel ? (
                  <Button
                    size="icon"
                    className={mode === 'add' ? 'size-10' : 'size-11'}
                    hitSlop={mode === 'add' ? 2 : undefined}
                    accessibilityLabel={actionLabel}
                    onPress={onSubmit}
                    disabled={!isValid || isSubmitting}
                  >
                    <Icon
                      as={mode === 'add' ? ArrowUpIcon : CheckIcon}
                      size={22}
                      strokeWidth={mode === 'add' ? 2.5 : 2}
                      className="text-primary-foreground"
                    />
                  </Button>
                ) : undefined
              }
            >
              {fields}
            </ItemComposerCard>
          </View>
        )}
      />
    </TrueSheet>
  );
}
