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
import { ChartType, ValueConfig, DataSourceId, AxisType, FilterConfig, AxisRangeConfig, YAxisMode } from '@/types';
import { getChartDataForConfig, formatNumber, getValueUnit, hasDrilldownForValue } from '@/lib/dataUtils';
import DrilldownModal from './DrilldownModal';

interface ChartPreviewProps {
  chartType: ChartType;
  values: ValueConfig[];
  dataSource?: DataSourceId;
  primaryAxis?: AxisType;
  filters?: FilterConfig[];
  axisRange?: AxisRangeConfig;
  yAxisMode?: YAxisMode;
}

const COLORS = {
  bar: ['#6b7280', '#374151', '#9ca3af', '#4b5563'],
  line: ['#dc2626', '#2563eb', '#16a34a', '#ca8a04'],
  pie: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
};

export default function ChartPreview({
  chartType,
  values,
  dataSource,
  primaryAxis = 'year',
  filters = [],
  axisRange,
  yAxisMode = 'auto'
}: ChartPreviewProps) {
  const [drilldownInfo, setDrilldownInfo] = useState<{ dataSource: DataSourceId; code: string } | null>(null);
  const validValues = values.filter(v => v.value);

  // ドリルダウン可能な値を特定
  const drilldownableValues = useMemo(() => {
    const result: Record<number, { dataSource: DataSourceId; code: string }> = {};
    validValues.forEach((v, index) => {
      if (hasDrilldownForValue(v.dataSource, v.value)) {
        result[index] = { dataSource: v.dataSource, code: v.value };
      }
    });
    return result;
  }, [validValues]);

  const { data: rawData, labels, xAxisKey } = useMemo(() => {
    if (dataSource) {
      return getChartDataForConfig(dataSource, primaryAxis, validValues, filters);
    }
    // フォールバック: dataSourceがない場合は最初のvalueから判定
    const firstSource = validValues[0]?.dataSource;
    if (firstSource) {
      return getChartDataForConfig(firstSource, primaryAxis, validValues, filters);
    }
    return { data: [], labels: {}, xAxisKey: 'year' };
  }, [dataSource, primaryAxis, validValues, filters]);

  // 軸範囲でデータをフィルタリング
  const data = useMemo(() => {
    if (!axisRange) return rawData;

    const { startIndex, endIndex, selectedItems } = axisRange;

    // 年度軸の場合：インデックス範囲でフィルタリング
    if (primaryAxis === 'year' && (startIndex !== undefined || endIndex !== undefined)) {
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
  }, [rawData, axisRange, primaryAxis, xAxisKey]);

  if (validValues.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-400">
          データを選択するとプレビューが表示されます
        </p>
      </div>
    );
  }

  // Y軸ラベルを生成（項目名＋単位）
  const getYAxisLabel = (valueIndex: number): string => {
    const value = validValues[valueIndex];
    if (!value) return '';
    const label = labels[`value${valueIndex}`] || '';
    const unit = getValueUnit(value.dataSource, value.value);
    // 項目名が長い場合は切り詰め
    const shortLabel = label.length > 10 ? label.slice(0, 10) + '...' : label;
    return unit ? `${shortLabel}（${unit}）` : shortLabel;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
      case 'line':
        // Y軸モードに基づいて共通軸を判定
        const firstUnit = validValues.length > 0 ? getValueUnit(validValues[0].dataSource, validValues[0].value) : '';
        const autoShared = validValues.every(v => getValueUnit(v.dataSource, v.value) === firstUnit);
        const useSharedAxis = validValues.length > 1 && (
          yAxisMode === 'shared' ||
          (yAxisMode === 'auto' && autoShared)
        );

        // 左軸ラベル
        const leftAxisLabel = getYAxisLabel(0);
        // 右軸ラベル（2つ目の値があり、共通軸でない場合）
        const rightAxisLabel = validValues.length > 1 && !useSharedAxis ? getYAxisLabel(1) : '';

        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 20, right: validValues.length > 1 && !useSharedAxis ? 80 : 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={{ stroke: '#d1d5db' }}
                interval={0}
                angle={xAxisKey !== 'year' ? -45 : 0}
                textAnchor={xAxisKey !== 'year' ? 'end' : 'middle'}
                height={xAxisKey !== 'year' ? 80 : 30}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => formatNumber(value, true)}
                label={{
                  value: useSharedAxis ? `（${firstUnit}）` : leftAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10 }
                }}
              />
              {validValues.length > 1 && !useSharedAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(value) => formatNumber(value, true)}
                  label={{
                    value: rightAxisLabel,
                    angle: 90,
                    position: 'insideRight',
                    style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10 }
                  }}
                />
              )}
              <Tooltip
                formatter={(value: number, name: string) => [formatNumber(value), name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 0,
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {validValues.map((v, index) => {
                const key = `value${index}`;
                // 共通軸の場合は全て左軸、それ以外は index === 0 が左、それ以外が右
                const yAxisId = useSharedAxis ? 'left' : (index === 0 ? 'left' : 'right');
                const label = labels[key] || `値${index + 1}`;
                const isDrilldownable = drilldownableValues[index];

                if (v.seriesType === 'bar') {
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
                  return (
                    <Line
                      key={key}
                      yAxisId={yAxisId}
                      type="monotone"
                      dataKey={key}
                      name={label}
                      stroke={COLORS.line[index % COLORS.line.length]}
                      strokeWidth={2}
                      dot={{ fill: COLORS.line[index % COLORS.line.length], strokeWidth: 0, r: 3 }}
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
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
                  borderRadius: 0,
                  fontSize: 12
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
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 bg-gray-50">{xAxisLabel}</th>
                  {validValues.map((_, index) => {
                    const isDrilldownable = drilldownableValues[index];
                    return (
                      <th key={index} className="px-3 py-2 text-right font-medium text-gray-700 bg-gray-50">
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
                    <td className="px-3 py-2 text-gray-900 border-b border-gray-100">{row[xAxisKey]}</td>
                    {validValues.map((_, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 text-right text-gray-900 border-b border-gray-100">
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

  const hasDrilldown = Object.keys(drilldownableValues).length > 0;

  return (
    <div className="border border-gray-200 bg-white">
      {renderChart()}
      {hasDrilldown && (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>グラフ要素をクリックで内訳を表示</span>
          </div>
        </div>
      )}
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
