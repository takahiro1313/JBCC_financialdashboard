'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartConfig } from '@/types';
import { getChartDataForConfig, formatNumber, getValueUnit, hasDrilldownForValue } from '@/lib/dataUtils';
import DrilldownModal from './DrilldownModal';
import { DataSourceId } from '@/types';

interface ChartDisplayInlineProps {
  config: ChartConfig;
  onEdit: () => void;
  onDelete: () => void;
}

const COLORS = {
  bar: ['#6b7280', '#374151', '#9ca3af', '#4b5563'],
  line: ['#dc2626', '#2563eb', '#16a34a', '#ca8a04'],
  pie: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#1f2937', '#4b5563', '#a3a3a3', '#525252']
};

export default function ChartDisplayInline({ config, onEdit, onDelete }: ChartDisplayInlineProps) {
  const [drilldownInfo, setDrilldownInfo] = useState<{ dataSource: DataSourceId; code: string } | null>(null);

  const { data: rawData, labels, xAxisKey } = useMemo(() => {
    return getChartDataForConfig(
      config.dataSource,
      config.primaryAxis,
      config.values,
      config.filters
    );
  }, [config.dataSource, config.primaryAxis, config.values, config.filters]);

  // 軸範囲でデータをフィルタリング
  const data = useMemo(() => {
    if (!config.axisRange) return rawData;

    const { startIndex, endIndex, selectedItems } = config.axisRange;

    // 年度軸の場合：インデックス範囲でフィルタリング
    if (config.primaryAxis === 'year' && (startIndex !== undefined || endIndex !== undefined)) {
      const start = startIndex ?? 0;
      const end = endIndex ?? rawData.length - 1;
      return rawData.slice(start, end + 1);
    }

    // カテゴリ軸の場合：選択された項目でフィルタリング
    if (selectedItems && selectedItems.length > 0) {
      return rawData.filter(item => {
        const axisValue = item[xAxisKey];
        return selectedItems.includes(axisValue as string);
      });
    }

    return rawData;
  }, [rawData, config.axisRange, config.primaryAxis, xAxisKey]);

  // ドリルダウン可能な値を特定
  const drilldownableValues = useMemo(() => {
    const result: Record<number, { dataSource: DataSourceId; code: string }> = {};
    config.values.forEach((v, index) => {
      if (hasDrilldownForValue(v.dataSource, v.value)) {
        result[index] = { dataSource: v.dataSource, code: v.value };
      }
    });
    return result;
  }, [config.values]);

  const hasDrilldown = Object.keys(drilldownableValues).length > 0;

  // Y軸ラベルを生成（項目名＋単位）
  const getYAxisLabel = (valueIndex: number): string => {
    const value = config.values[valueIndex];
    if (!value) return '';
    const label = labels[`value${valueIndex}`] || '';
    const unit = getValueUnit(value.dataSource, value.value);
    // 項目名が長い場合は切り詰め
    const shortLabel = label.length > 10 ? label.slice(0, 10) + '...' : label;
    return unit ? `${shortLabel}（${unit}）` : shortLabel;
  };

  const renderChart = () => {
    switch (config.chartType) {
      case 'bar':
      case 'line':
        // Y軸モードに基づいて共通軸を判定
        const firstUnit = getValueUnit(config.values[0].dataSource, config.values[0].value);
        const autoShared = config.values.every(v => getValueUnit(v.dataSource, v.value) === firstUnit);
        const yAxisMode = config.yAxisMode || 'auto';
        const useSharedAxis = config.values.length > 1 && (
          yAxisMode === 'shared' ||
          (yAxisMode === 'auto' && autoShared)
        );

        // 左軸ラベル
        const leftAxisLabel = getYAxisLabel(0);
        // 右軸ラベル（2つ目の値があり、共通軸でない場合）
        const rightAxisLabel = config.values.length > 1 && !useSharedAxis ? getYAxisLabel(1) : '';

        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: config.values.length > 1 && !useSharedAxis ? 100 : 30, left: 100, bottom: xAxisKey !== 'year' ? 80 : 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                interval={0}
                angle={xAxisKey !== 'year' ? -45 : 0}
                textAnchor={xAxisKey !== 'year' ? 'end' : 'middle'}
                height={xAxisKey !== 'year' ? 80 : 30}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => formatNumber(value, true)}
                label={{
                  value: useSharedAxis ? `（${getValueUnit(config.values[0].dataSource, config.values[0].value)}）` : leftAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 11 }
                }}
              />
              {config.values.length > 1 && !useSharedAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(value) => formatNumber(value, true)}
                  label={{
                    value: rightAxisLabel,
                    angle: 90,
                    position: 'insideRight',
                    style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 11 }
                  }}
                />
              )}
              <Tooltip
                formatter={(value: number, name: string) => [formatNumber(value), name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0
                }}
              />
              <Legend />
              {config.values.map((v, index) => {
                const key = `value${index}`;
                // 共通軸の場合は全て左軸、それ以外は index === 0 が左、それ以外が右
                const yAxisId = useSharedAxis ? 'left' : (index === 0 ? 'left' : 'right');
                const label = labels[key] || `値${index + 1}`;

                if (v.seriesType === 'bar') {
                  const isDrilldownable = drilldownableValues[index];
                  return (
                    <Bar
                      key={key}
                      yAxisId={yAxisId}
                      dataKey={key}
                      name={label}
                      fill={COLORS.bar[index % COLORS.bar.length]}
                      cursor={isDrilldownable ? 'pointer' : 'default'}
                      onClick={() => {
                        if (isDrilldownable) {
                          setDrilldownInfo(isDrilldownable);
                        }
                      }}
                    />
                  );
                } else {
                  const isDrilldownable = drilldownableValues[index];
                  return (
                    <Line
                      key={key}
                      yAxisId={yAxisId}
                      type="monotone"
                      dataKey={key}
                      name={label}
                      stroke={COLORS.line[index % COLORS.line.length]}
                      strokeWidth={2}
                      dot={{ fill: COLORS.line[index % COLORS.line.length], strokeWidth: 0, r: 4 }}
                      cursor={isDrilldownable ? 'pointer' : 'default'}
                      activeDot={isDrilldownable ? {
                        cursor: 'pointer',
                        onClick: () => setDrilldownInfo(isDrilldownable)
                      } : undefined}
                    />
                  );
                }
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = data
          .filter(d => {
            const val = d.value0;
            return val !== null && typeof val === 'number' && val > 0;
          })
          .slice(xAxisKey === 'year' ? -5 : 0) // カテゴリ軸の場合は全件表示
          .map(d => ({
            name: d[xAxisKey] as string,
            value: d.value0 as number
          }));

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: '#9ca3af' }}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [formatNumber(value), name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        // テーブルヘッダーのラベル
        const xAxisLabel = xAxisKey === 'year' ? '年度' :
                          xAxisKey === 'shareholder' ? '株主' :
                          xAxisKey === 'vehicleType' ? '車両種別' :
                          xAxisKey === 'freightType' ? '貨物種別' :
                          xAxisKey === 'segment' ? 'セグメント' :
                          xAxisKey === 'region' ? '地域' :
                          xAxisKey === 'locationType' ? '拠点種別' : '項目';

        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-700 bg-gray-50">{xAxisLabel}</th>
                  {config.values.map((v, index) => {
                    const isDrilldownable = drilldownableValues[index];
                    return (
                      <th key={index} className="px-4 py-3 text-right font-medium text-gray-700 bg-gray-50">
                        <span className="flex items-center justify-end gap-1">
                          {labels[`value${index}`] || `値${index + 1}`}
                          {isDrilldownable && (
                            <button
                              onClick={() => setDrilldownInfo(isDrilldownable)}
                              className="p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="内訳を表示"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={row[xAxisKey] as string} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-900 border-b border-gray-100">{row[xAxisKey]}</td>
                    {config.values.map((_, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 text-right text-gray-900 border-b border-gray-100">
                        {formatNumber(row[`value${colIndex}`] as number | null)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">
            {config.title}
          </h3>
          {config.description && (
            <p className="mt-1 text-sm text-gray-600">
              {config.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* チャート */}
      <div className="p-6">
        {renderChart()}
      </div>

      {/* 凡例 */}
      <div className="px-6 pb-6">
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs text-gray-500">
              {config.values.map((v, index) => {
                const isDrilldownable = drilldownableValues[index];
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3"
                      style={{
                        backgroundColor: v.seriesType === 'bar'
                          ? COLORS.bar[index % COLORS.bar.length]
                          : COLORS.line[index % COLORS.line.length]
                      }}
                    ></span>
                    <span>{labels[`value${index}`] || `値${index + 1}`}</span>
                    {isDrilldownable && (
                      <button
                        onClick={() => setDrilldownInfo(isDrilldownable)}
                        className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="内訳を表示"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {hasDrilldown && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>↓アイコンで内訳を表示</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ドリルダウンモーダル */}
      {drilldownInfo && (
        <DrilldownModal
          dataSource={drilldownInfo.dataSource}
          parentCode={drilldownInfo.code}
          onClose={() => setDrilldownInfo(null)}
        />
      )}
    </div>
  );
}
