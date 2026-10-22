import { Redirect } from 'expo-router';

import { QuantityWorkspaceScreen } from '@/features/quantity/components/workspace-screen';
import { quantityWorkspaceAvailable } from '@/features/quantity/config';

export default function QuantityWorkspaceRoute() {
  if (!quantityWorkspaceAvailable()) return <Redirect href="/(tabs)" />;
  return <QuantityWorkspaceScreen />;
}
