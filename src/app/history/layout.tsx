import ProtectedLayout from '@/components/ProtectedLayout';

export default function HistoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
