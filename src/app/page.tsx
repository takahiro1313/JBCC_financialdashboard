'use client';

import { useState, useRef } from 'react';
import UnifiedCard from '@/components/UnifiedCard';
import AddChartButton from '@/components/AddChartButton';
import { CardConfig } from '@/types';
import JSZip from 'jszip';

interface CardItem {
  id: string;
  config: CardConfig | null;
}

// ダッシュボード設定の型
interface DashboardConfig {
  version: string;
  exportedAt: string;
  cards: {
    id: string;
    config: CardConfig | null;
  }[];
}

export default function Home() {
  const [cards, setCards] = useState<CardItem[]>([
    { id: 'initial', config: null }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addCard = () => {
    const newId = String(Date.now());
    setCards([...cards, { id: newId, config: null }]);
  };

  const deleteCard = (id: string) => {
    if (cards.length > 0) {
      setCards(cards.filter(card => card.id !== id));
    }
  };

  const updateCardConfig = (id: string, config: CardConfig) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, config } : card
    ));
  };

  // 画像が含まれているかチェック
  const hasImages = cards.some(c => c.config?.cardType === 'image');

  // ダッシュボード設定をエクスポート（画像あり→ZIP、なし→JSON）
  const handleExport = async () => {
    const validCards = cards.filter(c => c.config !== null);

    if (hasImages) {
      // ZIP形式でエクスポート
      const zip = new JSZip();

      // 画像を別ファイルとして保存し、設定からは参照に置き換え
      const cardsWithImageRefs = validCards.map((card, index) => {
        if (card.config?.cardType === 'image' && card.config.imageData) {
          const imageFileName = `images/image_${index}.png`;
          // Base64データからバイナリに変換
          const base64Data = card.config.imageData.split(',')[1];
          zip.file(imageFileName, base64Data, { base64: true });

          return {
            ...card,
            config: {
              ...card.config,
              imageData: `@ref:${imageFileName}` // 参照に置き換え
            }
          };
        }
        return card;
      });

      const dashboardConfig: DashboardConfig = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        cards: cardsWithImageRefs
      };

      zip.file('dashboard.json', JSON.stringify(dashboardConfig, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // JSON形式でエクスポート
      const dashboardConfig: DashboardConfig = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        cards: validCards
      };

      const jsonString = JSON.stringify(dashboardConfig, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // ダッシュボード設定をインポート
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.zip')) {
        // ZIP形式のインポート
        const zip = await JSZip.loadAsync(file);
        const configFile = zip.file('dashboard.json');

        if (!configFile) {
          alert('無効なZIPファイルです（dashboard.jsonが見つかりません）');
          return;
        }

        const configContent = await configFile.async('string');
        const dashboardConfig: DashboardConfig = JSON.parse(configContent);

        // 画像参照を実際のデータに置き換え
        const cardsWithImages = await Promise.all(
          dashboardConfig.cards.map(async (card) => {
            if (card.config?.cardType === 'image' && typeof card.config.imageData === 'string' && card.config.imageData.startsWith('@ref:')) {
              const imagePath = card.config.imageData.replace('@ref:', '');
              const imageFile = zip.file(imagePath);

              if (imageFile) {
                const imageData = await imageFile.async('base64');
                return {
                  ...card,
                  config: {
                    ...card.config,
                    imageData: `data:image/png;base64,${imageData}`
                  }
                };
              }
            }
            return card;
          })
        );

        const importedCards: CardItem[] = cardsWithImages.map((card, index) => ({
          id: `imported-${Date.now()}-${index}`,
          config: card.config
        }));

        if (importedCards.length > 0) {
          setCards(importedCards);
        } else {
          alert('インポートできるカードがありません');
        }
      } else {
        // JSON形式のインポート
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const dashboardConfig: DashboardConfig = JSON.parse(content);

            // バージョンチェック
            if (!dashboardConfig.version || !dashboardConfig.cards) {
              alert('無効な設定ファイルです');
              return;
            }

            // 新しいIDを割り当てて設定を読み込み
            const importedCards: CardItem[] = dashboardConfig.cards.map((card, index) => ({
              id: `imported-${Date.now()}-${index}`,
              config: card.config
            }));

            if (importedCards.length > 0) {
              setCards(importedCards);
            } else {
              alert('インポートできるカードがありません');
            }
          } catch {
            alert('設定ファイルの読み込みに失敗しました');
          }
        };
        reader.readAsText(file);
      }
    } catch {
      alert('ファイルの読み込みに失敗しました');
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // エクスポート可能なカードがあるか
  const hasExportableCards = cards.some(c => c.config !== null);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              経営ダッシュボード
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              菜の花運輸の財務データを可視化し、経営状況を分析します
            </p>
          </div>

          {/* エクスポート/インポートボタン */}
          <div className="flex items-center gap-2">
            {/* インポートボタン */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.zip"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
              title="設定を読み込み"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>読込</span>
            </button>

            {/* エクスポートボタン */}
            <button
              onClick={handleExport}
              disabled={!hasExportableCards}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border transition-colors ${
                hasExportableCards
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200'
                  : 'text-gray-300 border-gray-100 cursor-not-allowed'
              }`}
              title={hasImages ? '設定を保存（ZIP）' : '設定を保存（JSON）'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>

      {/* カード一覧 */}
      <div className="space-y-6">
        {cards.map((card) => (
          <UnifiedCard
            key={card.id}
            id={card.id}
            initialConfig={card.config}
            onDelete={deleteCard}
            onConfigChange={updateCardConfig}
          />
        ))}

        {/* カード追加ボタン */}
        <AddChartButton onClick={addCard} />
      </div>

      {/* 補足情報 */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          データについて
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">損益計算書（PL）</span>
            <p>売上高から当期純利益まで</p>
          </div>
          <div>
            <span className="font-medium">貸借対照表（BS）</span>
            <p>資産・負債・純資産の状態</p>
          </div>
          <div>
            <span className="font-medium">財務指標</span>
            <p>収益性・安全性・効率性指標</p>
          </div>
          <div>
            <span className="font-medium">その他データ</span>
            <p>セグメント・株主・拠点情報</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          菜の花運輸（架空の運送会社）の2016〜2025年の財務データを収録しています。
        </p>
      </div>

      {/* AIデモへのリンク */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded">
        <a
          href="/demo"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>AI アシスタント付きデモを試す</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <p className="text-xs text-gray-500 mt-1">
          財務データについてAIに質問しながらダッシュボードを操作できます
        </p>
      </div>
    </div>
  );
}
