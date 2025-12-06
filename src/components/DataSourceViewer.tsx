'use client';

import { useState } from 'react';
import plData from '@/data/pl.json';
import bsData from '@/data/bs.json';
import indicatorsData from '@/data/indicators.json';
import segmentData from '@/data/segment.json';
import shareholdersData from '@/data/shareholders.json';
import vehiclesData from '@/data/vehicles.json';
import locationsData from '@/data/locations.json';
import marketData from '@/data/market.json';

interface DataSource {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  years?: string[];
  getData: () => DataPreview;
}

interface DataPreview {
  headers: string[];
  rows: (string | number)[][];
  summary?: string;
}

// データソース定義
const dataSources: DataSource[] = [
  {
    id: 'pl',
    name: '損益計算書（PL）',
    description: '売上高から当期純利益までの損益項目',
    itemCount: plData.items.length,
    years: plData.years,
    getData: () => ({
      headers: ['項目', '階層1', '階層2', ...plData.years.slice(-3)],
      rows: plData.items.map(item => [
        item.hierarchy3,
        item.hierarchy1,
        item.hierarchy2,
        ...item.values.slice(-3).map(v => v?.toLocaleString() ?? '-')
      ]),
      summary: `${plData.items.length}項目 × ${plData.years.length}年分のデータ`
    })
  },
  {
    id: 'bs',
    name: '貸借対照表（BS）',
    description: '資産・負債・純資産の財政状態',
    itemCount: bsData.items.length,
    years: bsData.years,
    getData: () => ({
      headers: ['項目', '階層1', '階層2', ...bsData.years.slice(-3)],
      rows: bsData.items.map(item => [
        item.hierarchy3,
        item.hierarchy1,
        item.hierarchy2,
        ...item.values.slice(-3).map(v => v?.toLocaleString() ?? '-')
      ]),
      summary: `${bsData.items.length}項目 × ${bsData.years.length}年分のデータ`
    })
  },
  {
    id: 'indicators',
    name: '財務指標',
    description: '収益性・安全性・効率性等の経営指標',
    itemCount: Object.values(indicatorsData.categories).flat().length,
    years: indicatorsData.years,
    getData: () => {
      const allItems = Object.entries(indicatorsData.categories).flatMap(([category, items]) =>
        items.map(item => ({ ...item, category }))
      );
      return {
        headers: ['指標名', 'カテゴリ', '単位', ...indicatorsData.years.slice(-3)],
        rows: allItems.map(item => [
          item.name,
          item.category,
          item.unit,
          ...item.values.slice(-3).map(v => v !== null ? (typeof v === 'number' ? v.toFixed(2) : v) : '-')
        ]),
        summary: `${allItems.length}指標 × ${indicatorsData.years.length}年分のデータ`
      };
    }
  },
  {
    id: 'segment',
    name: 'セグメント情報',
    description: '事業セグメント別の売上高・利益',
    itemCount: segmentData.items.length,
    getData: () => ({
      headers: ['項目', '2024年3月期', '2025年3月期'],
      rows: segmentData.items.slice(0, 8).map(item => {
        const keys = Object.keys(item.values);
        const latestKeys = keys.slice(-2);
        return [
          item.name,
          ...latestKeys.map(k => {
            const val = (item.values as unknown as Record<string, number | undefined>)[k];
            return val !== undefined ? val.toLocaleString() : '-';
          })
        ];
      }),
      summary: `${segmentData.segments.length}セグメント × ${segmentData.items.length}項目`
    })
  },
  {
    id: 'shareholders',
    name: '株主構成',
    description: '主要株主と持株比率',
    itemCount: shareholdersData.items.length,
    getData: () => ({
      headers: ['株主名', 'カテゴリ', '保有株式数', '持株比率'],
      rows: shareholdersData.items.map(item => [
        item.name,
        item.category,
        item.shares.toLocaleString(),
        `${item.ratio}%`
      ]),
      summary: `発行済株式: ${shareholdersData.totalShares.toLocaleString()}株`
    })
  },
  {
    id: 'vehicles',
    name: '車両情報',
    description: '車両種別台数と積載率',
    itemCount: 3,
    getData: () => ({
      headers: ['種別', '台数', '構成比'],
      rows: [
        ['大型自動車', vehiclesData.items[0].values['大型自動車'].toLocaleString(), `${vehiclesData.items[1].values['大型自動車']}%`],
        ['中型自動車', vehiclesData.items[0].values['中型自動車'].toLocaleString(), `${vehiclesData.items[1].values['中型自動車']}%`],
        ['小型自動車', vehiclesData.items[0].values['小型自動車'].toLocaleString(), `${vehiclesData.items[1].values['小型自動車']}%`],
      ],
      summary: `総台数: ${vehiclesData.total.toLocaleString()}台 / 積載率: ${vehiclesData.loadingRate}%`
    })
  },
  {
    id: 'locations',
    name: '拠点情報',
    description: '全国拠点ネットワーク',
    itemCount: locationsData.regions.length,
    getData: () => ({
      headers: ['地域', '支店', '営業所', '物流センター'],
      rows: locationsData.regions.slice(0, 8).map(region => {
        const branch = locationsData.items.find(i => i.code === 'loc_branch');
        const office = locationsData.items.find(i => i.code === 'loc_office');
        const center = locationsData.items.find(i => i.code === 'loc_center');
        return [
          region,
          (branch?.values as unknown as Record<string, number>)?.[`${region}_支店`] ?? 0,
          (office?.values as unknown as Record<string, number>)?.[`${region}_営業所`] ?? 0,
          (center?.values as unknown as Record<string, number>)?.[`${region}_物流センター`] ?? 0
        ];
      }),
      summary: `国内${locationsData.summary.domestic.total}拠点 + 海外${locationsData.summary.overseas.total}拠点`
    })
  },
  {
    id: 'market',
    name: '市場データ',
    description: '業界・市場関連指標',
    itemCount: marketData.items.length,
    getData: () => {
      const latestYears = marketData.years.slice(-3);
      return {
        headers: ['項目', '単位', ...latestYears],
        rows: marketData.items.map(item => {
          const values = item.values as unknown as Record<string, number | null>;
          return [
            item.name,
            item.unit,
            ...latestYears.map(y => values[y] !== null && values[y] !== undefined ? values[y]!.toLocaleString() : '-')
          ];
        }),
        summary: `${marketData.items.length}項目 × ${marketData.years.length}年分`
      };
    }
  }
];

export default function DataSourceViewer() {
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [preview, setPreview] = useState<DataPreview | null>(null);

  const handleSourceClick = (source: DataSource) => {
    setSelectedSource(source);
    setPreview(source.getData());
  };

  const closeModal = () => {
    setSelectedSource(null);
    setPreview(null);
  };

  return (
    <>
      {/* データソース一覧 */}
      <div className="mt-4">
        <h4 className="text-xs font-medium text-gray-600 mb-2">利用可能なデータソース</h4>
        <div className="flex flex-wrap gap-2">
          {dataSources.map(source => (
            <button
              key={source.id}
              onClick={() => handleSourceClick(source)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs text-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              {source.name}
              <span className="text-gray-400">({source.itemCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* モーダル */}
      {selectedSource && preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedSource.name}</h3>
                <p className="text-sm text-gray-500">{selectedSource.description}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
              {preview.summary && (
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 px-3 py-2 rounded">
                  {preview.summary}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {preview.headers.map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-gray-700 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 20 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    ... 他 {preview.rows.length - 20} 件のデータ
                  </p>
                )}
              </div>
            </div>

            {/* フッター */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
