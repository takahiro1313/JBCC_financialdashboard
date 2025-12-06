'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DataSourceId } from '@/types';
import { getCostBreakdownDrilldown, getPLDrilldown, getBSDrilldown, getDrilldownAncestors, hasDrilldownForValue, formatNumber } from '@/lib/dataUtils';
import plData from '@/data/pl.json';

// costBreakdownData はPLデータから動的に生成
const costBreakdownYears = plData.years;

interface DrilldownModalProps {
  dataSource: DataSourceId;
  parentCode: string;
  onClose: () => void;
}

interface DrilldownHistoryItem {
  code: string;
  name: string;
}

const COLORS = ['#6b7280', '#374151', '#9ca3af', '#4b5563', '#d1d5db', '#1f2937', '#a3a3a3', '#525252'];

export default function DrilldownModal({ dataSource, parentCode, onClose }: DrilldownModalProps) {
  // 階層ナビゲーション用の履歴
  const [history, setHistory] = useState<DrilldownHistoryItem[]>([]);
  const [currentCode, setCurrentCode] = useState(parentCode);

  // 現在のドリルダウンデータを取得
  const drilldownData = useMemo(() => {
    if (dataSource === 'cost_breakdown') {
      const { parent, children } = getCostBreakdownDrilldown(currentCode);
      if (!parent) return null;

      // chartDataを作成
      const chartData = costBreakdownYears.map(year => {
        const point: { [key: string]: string | number | null } = {
          year: year.replace('年3月期', '')
        };
        children.forEach((child, index) => {
          const values = child.values as Record<string, number | null>;
          point[`value${index}`] = values[year] ?? null;
        });
        return point;
      });

      // tableData用のchildrenを変換
      const tableChildren = children.map(child => ({
        code: child.code,
        name: child.name,
        values: costBreakdownYears.map(year => {
          const values = child.values as Record<string, number | null>;
          return values[year] ?? null;
        }),
        hasDrilldown: hasDrilldownForValue(dataSource, child.code)
      }));

      // parentの値を変換
      const parentValues = costBreakdownYears.map(year => {
        const values = parent.values as Record<string, number | null>;
        return values[year] ?? null;
      });

      return {
        parentName: parent.name,
        parentCode: parent.code,
        parentValues,
        children: tableChildren,
        years: costBreakdownYears,
        chartData
      };
    }

    if (dataSource === 'pl') {
      const { parent, children, years } = getPLDrilldown(currentCode);
      if (!parent) return null;

      // chartDataを作成
      const chartData = years.map((year, yearIndex) => {
        const point: { [key: string]: string | number | null } = {
          year: year.replace('年3月期', '')
        };
        children.forEach((child, index) => {
          point[`value${index}`] = child.values[yearIndex] ?? null;
        });
        return point;
      });

      // 子要素にドリルダウン可否を追加
      const enrichedChildren = children.map(child => ({
        ...child,
        hasDrilldown: hasDrilldownForValue(dataSource, child.code)
      }));

      return {
        parentName: parent.name,
        parentCode: parent.code,
        parentValues: parent.values,
        children: enrichedChildren,
        years,
        chartData
      };
    }

    if (dataSource === 'bs') {
      const { parent, children, years } = getBSDrilldown(currentCode);
      if (!parent) return null;

      // chartDataを作成
      const chartData = years.map((year, yearIndex) => {
        const point: { [key: string]: string | number | null } = {
          year: year.replace('年3月期', '')
        };
        children.forEach((child, index) => {
          point[`value${index}`] = child.values[yearIndex] ?? null;
        });
        return point;
      });

      // 子要素にドリルダウン可否を追加
      const enrichedChildren = children.map(child => ({
        ...child,
        hasDrilldown: hasDrilldownForValue(dataSource, child.code)
      }));

      return {
        parentName: parent.name,
        parentCode: parent.code,
        parentValues: parent.values,
        children: enrichedChildren,
        years,
        chartData
      };
    }

    return null;
  }, [dataSource, currentCode]);

  // 祖先（パンくず表示用）
  const ancestors = useMemo(() => {
    return getDrilldownAncestors(dataSource, currentCode);
  }, [dataSource, currentCode]);

  // 完全なパンくずリスト（初期の親 + 履歴 + 現在）
  const breadcrumbs = useMemo(() => {
    const crumbs: DrilldownHistoryItem[] = [];

    // 履歴を追加
    history.forEach(item => {
      crumbs.push(item);
    });

    // 現在の項目を追加
    if (drilldownData) {
      crumbs.push({ code: currentCode, name: drilldownData.parentName });
    }

    return crumbs;
  }, [history, currentCode, drilldownData]);

  // さらにドリルダウン
  const handleDrilldown = useCallback((childCode: string, childName: string) => {
    if (!hasDrilldownForValue(dataSource, childCode)) return;

    // 現在の項目を履歴に追加
    if (drilldownData) {
      setHistory(prev => [...prev, { code: currentCode, name: drilldownData.parentName }]);
    }
    setCurrentCode(childCode);
  }, [dataSource, currentCode, drilldownData]);

  // パンくずでナビゲーション
  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index >= breadcrumbs.length - 1) return; // 現在の項目はクリック不可

    const targetItem = breadcrumbs[index];
    // 履歴を切り詰める
    setHistory(prev => prev.slice(0, index));
    setCurrentCode(targetItem.code);
  }, [breadcrumbs]);

  // 戻る
  const handleBack = useCallback(() => {
    if (history.length === 0) return;

    const previousItem = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentCode(previousItem.code);
  }, [history]);

  // グラフの棒クリック
  const handleBarClick = useCallback((data: { code?: string; name?: string }) => {
    if (data.code && data.name && hasDrilldownForValue(dataSource, data.code)) {
      handleDrilldown(data.code, data.name);
    }
  }, [dataSource, handleDrilldown]);

  if (!drilldownData) {
    return null;
  }

  const { parentName, parentValues, children, years, chartData } = drilldownData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-auto shadow-xl">
        {/* ヘッダー */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-10">
          <div className="flex-1">
            {/* パンくずリスト */}
            <div className="flex items-center gap-1 text-sm mb-1">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.code} className="flex items-center">
                  {index > 0 && <span className="mx-1 text-gray-400">&gt;</span>}
                  {index < breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {crumb.name}
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-900">{crumb.name}</span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              ドリルダウン: 個別項目の推移
              {children.some(c => c.hasDrilldown) && (
                <span className="ml-2 text-blue-500">（クリックでさらに詳細を表示）</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* グラフ */}
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => formatNumber(value, true)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatNumber(value) + ' 百万円', name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0
                }}
              />
              <Legend
                payload={
                  // 凡例を上から下の順序で表示（グラフの積み上げ順と一致）
                  [...children].reverse().map((child, idx) => ({
                    value: child.name,
                    type: 'square' as const,
                    color: COLORS[(children.length - 1 - idx) % COLORS.length]
                  }))
                }
              />
              {/* Barを逆順でレンダリング（最初の項目が一番上に表示される） */}
              {[...children].reverse().map((child, reversedIndex) => {
                const originalIndex = children.length - 1 - reversedIndex;
                return (
                  <Bar
                    key={child.code}
                    dataKey={`value${originalIndex}`}
                    name={child.name}
                    stackId="a"
                    fill={COLORS[originalIndex % COLORS.length]}
                    cursor={child.hasDrilldown ? 'pointer' : 'default'}
                    onClick={() => {
                      if (child.hasDrilldown) {
                        handleDrilldown(child.code, child.name);
                      }
                    }}
                    style={{
                      opacity: child.hasDrilldown ? 1 : 0.8
                    }}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* テーブル */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-700 bg-gray-50">項目</th>
                  {years.map(year => (
                    <th key={year} className="px-4 py-3 text-right font-medium text-gray-700 bg-gray-50 whitespace-nowrap">
                      {year.replace('年3月期', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {children.map((child, rowIndex) => (
                  <tr
                    key={child.code}
                    className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${child.hasDrilldown ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => {
                      if (child.hasDrilldown) {
                        handleDrilldown(child.code, child.name);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-gray-900 border-b border-gray-100 font-medium">
                      <span className="flex items-center gap-2">
                        {child.name}
                        {child.hasDrilldown && (
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </span>
                    </td>
                    {child.values.map((value, idx) => (
                      <td key={idx} className="px-4 py-3 text-right text-gray-900 border-b border-gray-100">
                        {formatNumber(value)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* 合計行 */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3 text-gray-900 border-b border-gray-200">
                    {parentName}
                  </td>
                  {parentValues.map((value, idx) => (
                    <td key={idx} className="px-4 py-3 text-right text-gray-900 border-b border-gray-200">
                      {formatNumber(value)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {history.length > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
