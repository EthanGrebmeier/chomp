import { id } from '@instantdb/react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { ConflictCard } from '../components/conflict-card';
import { quantityWorkspaceAvailable } from '../config';
import { QuantityTransaction } from '../transaction';

import { useQuantityList } from './session';

export function QuantityListStatus({ listId }: { listId?: string }) {
  const session = useQuantityList(listId);
  if (!quantityWorkspaceAvailable() || !listId) return null;
  const errors = session.pending.filter(p => p.error);
  return (
    <View className="px-4">
      {session.error || errors.length ? (
        <View className="gap-2 rounded-xl bg-muted p-3">
          <Text accessibilityRole="alert">
            {session.error ?? errors[0].error}
          </Text>
          <Button
            variant="outline"
            onPress={() => {
              void session.retry();
            }}
          >
            <Text>Retry saved changes</Text>
          </Button>
        </View>
      ) : null}
      {session.state.conflicts.map(conflict => (
        <ConflictCard
          key={conflict.operation.id}
          conflict={conflict}
          state={session.state}
          disabled={!session.canEdit}
          onKeepCurrent={() => {
            void session.send(
              new QuantityTransaction(session.state).build(
                id(),
                'Keep current quantities',
                [conflict.operation.id]
              )
            );
          }}
        />
      ))}
    </View>
  );
}
