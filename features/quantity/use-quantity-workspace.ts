import { id } from '@instantdb/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { db } from '@/lib/instant';

import { createMaterializer } from './model';
import {
  flushOutbox,
  mergeConfirmedOperations,
  readWorkspaceState,
  type Pending,
} from './sync-workspace';
import type { Operation } from './types';

const workspaceQuery = (workspaceId: string) => ({
  gqc_workspaces_v1: { $: { where: { id: workspaceId } } },
  gqc_operations_v1: { $: { where: { workspaceId } } },
});

/** Durable app outbox plus the SDK queue; stable operation IDs make retries safe. */
export function useQuantityWorkspace(
  workspaceId: string,
  userId: string,
  afterConfirm?: (operation: Operation, workspaceId: string) => Promise<void>
) {
  const query = db.useQuery(workspaceQuery(workspaceId));
  const connection = db.useConnectionStatus();
  const [verified, setVerified] = useState(false);
  const [confirmed, setConfirmed] = useState<Operation[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [outboxLoaded, setOutboxLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(pending);
  const serial = useRef<Promise<unknown> | null>(null);
  const sending = useRef(false);
  const key = `quantity-outbox-v1:${userId}:${workspaceId}`;
  const changePending = useCallback(
    (change: (values: Pending[]) => Pending[]) => {
      const result = (serial.current ?? Promise.resolve()).then(async () => {
        const next = change(pendingRef.current);
        await AsyncStorage.setItem(key, JSON.stringify(next));
        pendingRef.current = next;
        setPending(next);
      });
      serial.current = result.catch(() => {});
      return result;
    },
    [key]
  );

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then(value => {
        if (!active) return;
        const saved: Pending[] = value ? JSON.parse(value) : [];
        if (!Array.isArray(saved) || saved.some(p => !p.operation?.id))
          throw new Error('Invalid outbox');
        pendingRef.current = saved;
        setPending(saved);
        setOutboxLoaded(true);
      })
      .catch(() => {
        if (active)
          setError(
            'Saved changes could not be loaded. Keep this app installed and retry.'
          );
      });
    return () => {
      active = false;
    };
  }, [key]);

  const refresh = useCallback(() => {
    // A distinct query hash forces a fresh server acknowledgement. No limit,
    // pagination, per-entry permission filter or nested optional relation.
    return db
      .queryOnce(workspaceQuery(workspaceId), {
        ruleParams: { quantityRead: id() },
      })
      .then(result => {
        if (
          result.data.gqc_workspaces_v1.length !== 1 ||
          !Array.isArray(result.data.gqc_operations_v1)
        )
          throw new Error('Workspace access is unavailable');
        setVerified(true);
        setConfirmed(previous =>
          mergeConfirmedOperations(
            previous,
            result.data.gqc_operations_v1.map(
              row => JSON.parse(row.body) as Operation
            )
          )
        );
        setError(null);
      })
      .catch(() => {
        setVerified(false);
        setError(
          'Could not verify the complete workspace. Reconnect and retry.'
        );
      });
  }, [workspaceId]);

  const [replay] = useState(createMaterializer);
  const flush = useCallback(() => {
    if (sending.current || !outboxLoaded || connection !== 'authenticated')
      return;
    sending.current = true;
    return flushOutbox({
      workspaceId,
      userId,
      replay,
      getPending: () => pendingRef.current,
      changePending,
      confirm: operation =>
        setConfirmed(values => mergeConfirmedOperations(values, [operation])),
      afterConfirm: operation =>
        afterConfirm?.(operation, workspaceId) ?? Promise.resolve(),
    }).finally(() => {
      sending.current = false;
    });
  }, [
    afterConfirm,
    changePending,
    connection,
    outboxLoaded,
    replay,
    userId,
    workspaceId,
  ]);

  useEffect(() => {
    if (connection === 'authenticated') void refresh();
  }, [connection, refresh]);
  useEffect(() => {
    void flush()?.catch(() =>
      setError('Unable to save the outbox. Retry before closing the app.')
    );
  }, [flush, pending]);

  const state = useMemo(
    () =>
      readWorkspaceState(
        confirmed,
        pending,
        query.data?.gqc_operations_v1 ?? [],
        query.data?.gqc_workspaces_v1.length,
        replay
      ),
    [confirmed, pending, query.data, replay]
  );

  const canEdit =
    verified &&
    outboxLoaded &&
    !query.isLoading &&
    !query.error &&
    !error &&
    state.complete &&
    query.data?.gqc_workspaces_v1.length === 1;
  const send = async (operation: Operation) => {
    if (!canEdit)
      throw new Error('Wait for the complete workspace before editing');
    // Persist before showing the action or submitting it to the SDK.
    await changePending(values => [...values, { operation }]);
  };
  const retry = async () => {
    await changePending(values =>
      values.map(p => ({ operation: p.operation }))
    );
    await refresh();
  };
  return {
    state,
    canEdit,
    send,
    refresh,
    retry,
    pending,
    connection,
    workspace: query.data?.gqc_workspaces_v1[0],
    error: error ?? state.error ?? query.error?.message,
    loading: query.isLoading || !outboxLoaded,
  };
}
