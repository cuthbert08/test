import { Dashboard } from '@/components/dashboard';
import ProtectedLayout from '@/components/ProtectedLayout';

export default function HomePage() {
  return (
    <ProtectedLayout>
      <Dashboard />
    </ProtectedLayout>
  );
}
