import ProtectedLayout from '@/components/ProtectedLayout';

export default function AnnouncementsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
