import ProtectedLayout from '@/components/ProtectedLayout';

export default function RotaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
