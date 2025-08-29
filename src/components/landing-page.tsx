"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, BellRing, Wrench, Users, ArrowRight } from "lucide-react"

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Shield className="h-6 w-6 text-primary" />
          <span className="sr-only">Bin Duty Manager</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" passHref>
             <Button variant="outline">Admin Login</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Automate Your Building's Bin Duty Rotation
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Our platform sends automated reminders, tracks maintenance issues, and manages resident communications, saving you time and hassle.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/report"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Report an Issue
                  </Link>
                </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Everything You Need to Manage Your Building</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-lg">
                  From automated reminders to issue tracking, our platform simplifies building management for everyone.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-8">
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="rounded-full bg-primary p-3 text-primary-foreground">
                    <BellRing className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Automated Reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Weekly duty reminders sent automatically via Email, SMS, and WhatsApp so no one ever forgets.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="rounded-full bg-primary p-3 text-primary-foreground">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Issue Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Residents can report maintenance issues through a simple form, notifying admins instantly.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="rounded-full bg-primary p-3 text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Resident Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Easily manage resident information, contact details, and the duty rotation order.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="contact" className="w-full py-12 md:py-20 lg:py-24">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Get in Touch</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-lg">
                Have questions or need support? Contact the building administrator.
              </p>
            </div>
             <div className="mx-auto w-full max-w-sm space-y-2">
                <Button asChild>
                    <Link href="/report">
                        Report a Building Issue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Bin Duty Manager. All rights reserved.</p>
      </footer>
    </div>
  )
}
