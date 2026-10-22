import { init } from '@instantdb/admin';
import { assertTestTarget } from './test-target.mjs';

export const names = {
  workspaces: 'gqc_workspaces_v1',
  operations: 'gqc_operations_v1',
};
export function testApp() {
  const appId = assertTestTarget(process.env);
  const db = init({ appId, adminToken: process.env.INSTANT_APP_ADMIN_TOKEN });
  return { db };
}
