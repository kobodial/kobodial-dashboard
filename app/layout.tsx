import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoboDial — Agent Dashboard",
  description:
    "Operational dashboard for KoboDial cash-in/cash-out agents and system operators. Not the end-user product — wallet holders use USSD on feature phones.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/wallets", label: "Wallets" },
  { href: "/transactions", label: "Transactions" },
  { href: "/agents", label: "Agents" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-ink-200 border-b bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">KoboDial</span>
              <span className="text-ink-500 text-sm">Agent Dashboard</span>
            </Link>
            <nav className="flex flex-wrap gap-1" aria-label="Main">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-ink-700 hover:bg-ink-100 hover:text-ink-900 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>

        <footer className="border-ink-200 text-ink-500 mt-8 border-t px-6 py-6 text-center text-xs">
          Operational tool for agents and operators. Wallet holders use USSD on feature phones —
          they never see this dashboard.
        </footer>
      </body>
    </html>
  );
}
