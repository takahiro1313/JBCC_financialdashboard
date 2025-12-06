import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '財務ダッシュボード | 菜の花運輸',
  description: '菜の花運輸の財務データを可視化するダッシュボード',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  菜の花運輸
                </h1>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-600">財務ダッシュボード</span>
              </div>
              <nav className="flex items-center gap-6">
                <a
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ダッシュボード
                </a>
                <a
                  href="/data"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  データ一覧
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-gray-400 text-center">
              JBCC 2025 - 経営ダッシュボード ハンズオン
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
