'use client';

import { useState, useRef } from 'react';
import UnifiedCard from '@/components/UnifiedCard';
import AddChartButton from '@/components/AddChartButton';
import AIChatSidebar from '@/components/AIChatSidebar';
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

export default function DemoPage() {
  const [cards, setCards] = useState<CardItem[]>([
    { id: 'initial', config: null }
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

      const blob = new Blob([JSON.stringify(dashboardConfig, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // ダッシュボード設定をインポート
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.zip')) {
        // ZIP形式の読み込み
        const zip = await JSZip.loadAsync(file);
        const configFile = zip.file('dashboard.json');

        if (!configFile) {
          alert('ZIPファイルにdashboard.jsonが含まれていません');
          return;
        }

        const configText = await configFile.async('text');
        const config: DashboardConfig = JSON.parse(configText);

        // 画像参照を実際のBase64データに置き換え
        const cardsWithImages = await Promise.all(
          config.cards.map(async (card) => {
            if (card.config?.cardType === 'image' && card.config.imageData?.startsWith('@ref:')) {
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

        if (cardsWithImages.length > 0) {
          setCards(cardsWithImages.map((card, index) => ({
            id: card.id || `imported-${index}`,
            config: card.config
          })));
        } else {
          alert('インポートできるカードがありません');
        }
      } else {
        // JSON形式の読み込み
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config: DashboardConfig = JSON.parse(event.target?.result as string);
            if (config.cards && config.cards.length > 0) {
              setCards(config.cards.map((card, index) => ({
                id: card.id || `imported-${index}`,
                config: card.config
              })));
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
    <div className={`transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
      <div className="space-y-6">
        {/* ページヘッダー */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  経営ダッシュボード
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  AI Demo
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                菜の花運輸の財務データを可視化し、AIアシスタントが分析をサポートします
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

              {/* AIチャットボタン */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm border transition-colors ${
                  isChatOpen
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-blue-600 hover:bg-blue-50 border-blue-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>AI Chat</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-700">貸借対照表（BS）</span>
              <p className="mt-1">
                資産、負債、純資産の勘定科目データ（2016〜2025年度）
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">損益計算書（PL）</span>
              <p className="mt-1">
                売上高、費用、利益の勘定科目データ（2016〜2025年度）
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">財務指標</span>
              <p className="mt-1">
                ROE、PBR、営業利益率など36の財務指標（2016〜2025年度）
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AIチャットサイドバー */}
      <AIChatSidebar isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
}
