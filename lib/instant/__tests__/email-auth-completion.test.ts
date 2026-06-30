import { afterEach, describe, expect, it } from 'vitest';

import {
  getIsEmailAuthCompletionActive,
  resetEmailAuthCompletionForTests,
  runWithEmailAuthCompletion,
  subscribeToEmailAuthCompletionState,
} from '../email-auth-completion';

describe('email auth completion coordination', () => {
  afterEach(() => {
    resetEmailAuthCompletionForTests();
  });

  it('marks email auth completion active while a screen-owned task is running', async () => {
    const states: boolean[] = [];
    const unsubscribe = subscribeToEmailAuthCompletionState(() => {
      states.push(getIsEmailAuthCompletionActive());
    });
    let resolveTask!: () => void;

    const completion = runWithEmailAuthCompletion(
      () =>
        new Promise<string>(resolve => {
          resolveTask = () => resolve('done');
        })
    );

    expect(getIsEmailAuthCompletionActive()).toBe(true);

    resolveTask();
    await expect(completion).resolves.toBe('done');

    expect(getIsEmailAuthCompletionActive()).toBe(false);
    expect(states).toEqual([true, false]);

    unsubscribe();
  });

  it('stays active until nested completion tasks have finished', async () => {
    await runWithEmailAuthCompletion(async () => {
      expect(getIsEmailAuthCompletionActive()).toBe(true);

      await runWithEmailAuthCompletion(async () => {
        expect(getIsEmailAuthCompletionActive()).toBe(true);
      });

      expect(getIsEmailAuthCompletionActive()).toBe(true);
    });

    expect(getIsEmailAuthCompletionActive()).toBe(false);
  });
});
