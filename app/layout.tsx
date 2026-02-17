import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coding Agent Eval Harness',
  description:
    'Head-to-head evaluation of GPT-5.3 Codex vs Claude Opus 4.6 on 10 real coding tasks. 16 runs, 6 dimensions, cross-provider dual-judge scoring.',
  openGraph: {
    title: 'Coding Agent Eval Harness',
    description:
      'Head-to-head evaluation of GPT-5.3 Codex vs Claude Opus 4.6 on 10 real coding tasks. 16 runs, 6 dimensions, cross-provider dual-judge scoring.',
    type: 'website',
    siteName: 'Coding Agent Eval',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coding Agent Eval Harness',
    description:
      'Head-to-head evaluation of GPT-5.3 Codex vs Claude Opus 4.6 on 10 real coding tasks.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 bg-white">
            <div className="mx-auto flex h-16 max-w-container items-center justify-between px-6">
              <a href="/" className="text-sm font-medium tracking-tight">
                Coding Agent Eval
              </a>
              <nav className="flex items-center gap-8">
                <a
                  href="/insights"
                  className="text-sm text-gray-600 transition-colors hover:text-black"
                >
                  Insights
                </a>
                <a
                  href="/agent-eval"
                  className="text-sm text-gray-600 transition-colors hover:text-black"
                >
                  Run Evals
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-100">
            <div className="mx-auto flex h-16 max-w-container items-center justify-end px-6">
              <div className="flex items-center gap-6">
                <a
                  href="https://www.linkedin.com/in/ashka-stephen/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 transition-colors hover:text-black"
                >
                  LinkedIn
                </a>
                <a
                  href="https://github.com/ashstep2/agent-eval-harness"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 transition-colors hover:text-black"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/ashstep2/agent-eval-harness/blob/main/PRODUCT_STRATEGY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 transition-colors hover:text-black"
                >
                  Product Strategy
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
