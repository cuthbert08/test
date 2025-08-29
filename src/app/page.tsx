import EchoBloom from "@/components/echo-bloom";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            EchoBloom
          </h1>
          <p className="mt-2 text-md md:text-lg text-muted-foreground">
            Record your voice, discover the emotion within.
          </p>
        </header>
        <EchoBloom />
      </div>
    </main>
  );
}
