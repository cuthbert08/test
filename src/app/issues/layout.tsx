import ProtectedLayout from '@/components/ProtectedLayout';

export default function IssuesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
