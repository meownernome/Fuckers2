import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NexusSync Hub | Roblox ↔ Discord Gateway',
  description: 'Automated high-performance network identity verification framework',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f1115] text-[#f3f4f6] min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.03),transparent_40%)] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}