import ProtectedRoute from '@/src/components/ProtectedRoute';

export default function FindDoctorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
