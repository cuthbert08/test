import ProtectedLayout from '@/components/ProtectedLayout';

export default function ResidentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
