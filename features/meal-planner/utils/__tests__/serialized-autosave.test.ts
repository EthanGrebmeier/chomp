import { expect, it, vi } from 'vitest';
import { SerializedAutosave } from '../serialized-autosave';

it('deduplicates timer and dismissal saves while persistence is pending', async () => {
  const editor = new SerializedAutosave();
  editor.reset('original');
  let finish!: () => void;
  const write = vi.fn(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      })
  );
  const first = editor.save('edited', write);
  await Promise.resolve();
  const dismissal = editor.save('edited', write);
  finish();
  await Promise.all([first, dismissal]);
  expect(write).toHaveBeenCalledTimes(1);
});

it('deletion waits for an in-flight save and cancels queued and dismissal saves', async () => {
  const editor = new SerializedAutosave();
  editor.reset('original');
  let finish!: () => void;
  const first = editor.save(
    'edit',
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      })
  );
  await Promise.resolve();
  const write = vi.fn();
  const queued = editor.save('later edit', write);
  const remove = vi.fn();
  const deletion = editor.stop().then(remove);
  const dismissal = editor.save('edit', write);
  expect(remove).not.toHaveBeenCalled();
  finish();
  await Promise.all([first, queued, deletion, dismissal]);
  expect(write).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledOnce();
});

it('allows retry after failure and ignores saves from a previous editor session', async () => {
  const editor = new SerializedAutosave();
  editor.reset('original');
  await expect(
    editor.save('edit', async () => {
      throw new Error('disk');
    })
  ).rejects.toThrow('disk');
  const write = vi.fn(async () => {});
  await editor.save('edit', write);
  const stale = editor.save('stale', write);
  editor.reset('new meal');
  await stale;
  await editor.save('new meal', write);
  expect(write).toHaveBeenCalledOnce();
});
