'use client';

import DataSourceViewer from '@/components/DataSourceViewer';

export default function DataPage() {
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          データ一覧
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          菜の花運輸の財務データソース一覧。各データソースをクリックすると内容を確認できます。
        </p>
      </div>

      {/* データソースビューア */}
      <div className="bg-white border border-gray-200 p-6">
        <DataSourceViewer />
      </div>

      {/* 補足情報 */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded">
        <h3 className="text-sm font-medium text-gray-700 mb-2">データについて</h3>
        <p className="text-xs text-gray-500">
          このダッシュボードでは、菜の花運輸（架空の運送会社）の2016〜2025年の財務データを使用しています。
          データは損益計算書（PL）、貸借対照表（BS）、財務指標、セグメント情報、株主構成、車両情報、拠点情報、市場データの8種類を収録しています。
        </p>
      </div>
    </div>
  );
}
