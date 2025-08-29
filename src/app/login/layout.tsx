export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex items-center justify-center min-h-screen">
            {children}
        </main>
    );
}
