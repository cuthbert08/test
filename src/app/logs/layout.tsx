import ProtectedLayout from '@/components/ProtectedLayout';

export default function LogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
