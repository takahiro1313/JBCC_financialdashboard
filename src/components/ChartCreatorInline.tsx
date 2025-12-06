'use client';

import { useState, useMemo } from 'react';
import { ChartConfig, ChartType, DataSourceId, SeriesType, ValueConfig, AxisType, FilterConfig } from '@/types';
import { getDataOptions, getDataSourceList, getAxisOptions, getAllowedChartTypesForSource, getYears, getSegments, getRegions, getLocationTypes, getAxisInfo, getDataSourcesWithAxis } from '@/lib/dataUtils';
import { getDataSourceMeta } from '@/data/dataSourceMeta';
import ChartPreview from './ChartPreview';

interface ValueItem {
  id: string;
  dataSource: DataSourceId;
  value: string;
  seriesType: SeriesType;
}

interface ChartCreatorInlineProps {
  initialConfig?: ChartConfig | null;
  onSubmit: (config: ChartConfig) => void;
  onCancel?: () => void;
  onDelete: () => void;
  isNew: boolean;
}

export default function ChartCreatorInline({
  initialConfig,
  onSubmit,
  onCancel,
  onDelete,
  isNew
}: ChartCreatorInlineProps) {
  // 基本情報
  const [title, setTitle] = useState(initialConfig?.title || '');
  const [description, setDescription] = useState(initialConfig?.description || '');

  // データソース選択（最初のステップ）
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceId | null>(
    initialConfig?.dataSource || null
  );

  // 軸選択
  const [primaryAxis, setPrimaryAxis] = useState<AxisType>(
    initialConfig?.primaryAxis || 'year'
  );

  // フィルタ
  const [filters, setFilters] = useState<FilterConfig[]>(
    initialConfig?.filters || []
  );

  // グラフ種類
  const [chartType, setChartType] = useState<ChartType | null>(initialConfig?.chartType || null);

  // 円グラフ用年度選択
  const [selectedYear, setSelectedYear] = useState<string>(
    initialConfig?.selectedYear || ''
  );

  // 値選択（データソースごとに選択可能）
  const [valueItems, setValueItems] = useState<ValueItem[]>(() => {
    if (initialConfig?.values) {
      return initialConfig.values.map((v, index) => ({
        id: String(index + 1),
        dataSource: v.dataSource,
        value: v.value,
        seriesType: v.seriesType
      }));
    }
    return [{ id: '1', dataSource: 'pl' as DataSourceId, value: '', seriesType: 'bar' as SeriesType }];
  });

  // データソース一覧
  const dataSources = getDataSourceList();

  // 選択されたデータソースのメタ情報
  const selectedMeta = useMemo(() => {
    return selectedDataSource ? getDataSourceMeta(selectedDataSource) : null;
  }, [selectedDataSource]);

  // 値選択で使えるデータソース（同じ主軸を持つデータソース）
  const availableSourcesForValue = useMemo(() => {
    if (!selectedDataSource) return [];
    // 同じ主軸を持つデータソースを取得
    const sourcesWithSameAxis = getDataSourcesWithAxis(primaryAxis);
    return dataSources.filter(s => sourcesWithSameAxis.includes(s.id as DataSourceId));
  }, [selectedDataSource, primaryAxis, dataSources]);

  // 複数のデータソースが値選択で使えるかどうか
  const canCombineSources = useMemo(() => {
    return availableSourcesForValue.length > 1;
  }, [availableSourcesForValue]);

  // 利用可能な軸
  const availableAxes = useMemo(() => {
    return selectedDataSource ? getAxisOptions(selectedDataSource) : [];
  }, [selectedDataSource]);

  // 利用可能なグラフ種類
  const allowedChartTypes = useMemo(() => {
    if (!selectedDataSource) return ['bar', 'line', 'pie', 'table'];
    return getAllowedChartTypesForSource(selectedDataSource);
  }, [selectedDataSource]);

  // グラフ種類リスト
  const chartTypeOptions: { value: ChartType; label: string }[] = [
    { value: 'bar', label: '棒グラフ' },
    { value: 'line', label: '折れ線グラフ' },
    { value: 'pie', label: '円グラフ' },
    { value: 'table', label: '表' }
  ];

  // フィルタ軸（主軸以外の軸）
  const filterAxes = useMemo(() => {
    return availableAxes.filter(axis => axis.type !== primaryAxis);
  }, [availableAxes, primaryAxis]);

  // 選択された値から使用中のデータソースを抽出
  const usedDataSources = useMemo(() => {
    const sources = valueItems
      .filter(item => item.value)
      .map(item => item.dataSource);
    return Array.from(new Set(sources));
  }, [valueItems]);

  // 軸情報（表示用）
  const axisInfoData = useMemo(() => {
    if (!selectedDataSource) return null;
    // 使用中のデータソースがあればそれを使用、なければ選択中のデータソースのみ
    const sourcesToCheck = usedDataSources.length > 0 ? usedDataSources : [selectedDataSource];
    return getAxisInfo(sourcesToCheck, primaryAxis);
  }, [selectedDataSource, primaryAxis, usedDataSources]);

  // フィルタの値オプションを取得
  const getFilterOptions = (axisType: AxisType): string[] => {
    switch (axisType) {
      case 'year':
        return selectedDataSource ? getYears(selectedDataSource) : [];
      case 'segment':
        return getSegments();
      case 'region':
        return getRegions();
      case 'location_type':
        return getLocationTypes();
      default:
        return [];
    }
  };

  // データソース変更時のリセット
  const handleDataSourceChange = (sourceId: DataSourceId) => {
    setSelectedDataSource(sourceId);
    const meta = getDataSourceMeta(sourceId);
    setPrimaryAxis(meta?.primaryAxis || 'year');
    setFilters([]);
    setChartType(null);
    // 値のデータソースも更新
    setValueItems([{ id: '1', dataSource: sourceId, value: '', seriesType: 'bar' }]);
    setSelectedYear('');
  };

  // 軸変更時のフィルタリセット
  const handleAxisChange = (axisType: AxisType) => {
    setPrimaryAxis(axisType);
    setFilters([]);
  };

  // フィルタ更新
  const updateFilter = (axisType: AxisType, value: string) => {
    setFilters(prev => {
      const existing = prev.find(f => f.axisType === axisType);
      if (existing) {
        return prev.map(f => f.axisType === axisType ? { ...f, selectedValue: value } : f);
      }
      return [...prev, { axisType, selectedValue: value }];
    });
  };

  // 値操作
  const addValueItem = () => {
    const newId = String(Date.now());
    const defaultSource = selectedDataSource || 'pl';
    setValueItems([...valueItems, { id: newId, dataSource: defaultSource, value: '', seriesType: 'bar' }]);
  };

  const removeValueItem = (id: string) => {
    if (valueItems.length > 1) {
      setValueItems(valueItems.filter(item => item.id !== id));
    }
  };

  const updateValueItem = (id: string, field: 'dataSource' | 'value' | 'seriesType', newValue: string) => {
    setValueItems(valueItems.map(item => {
      if (item.id === id) {
        if (field === 'dataSource') {
          return { ...item, dataSource: newValue as DataSourceId, value: '' };
        }
        if (field === 'seriesType') {
          return { ...item, seriesType: newValue as SeriesType };
        }
        return { ...item, [field]: newValue };
      }
      return item;
    }));
  };

  // 送信
  const handleSubmit = () => {
    if (!title || !chartType || !selectedDataSource || !valueItems[0]?.value) return;

    const values: ValueConfig[] = valueItems
      .filter(item => item.value)
      .map(item => ({
        id: item.id,
        dataSource: item.dataSource,
        value: item.value,
        seriesType: item.seriesType
      }));

    const config: ChartConfig = {
      cardType: 'chart',
      title,
      description,
      chartType,
      dataSource: selectedDataSource,
      values,
      primaryAxis,
      filters,
      selectedYear: chartType === 'pie' && selectedMeta?.isTimeSeries ? selectedYear : undefined
    };

    onSubmit(config);
  };

  const isValid = title && chartType && selectedDataSource && valueItems[0]?.value;

  // プレビュー用のValueConfig配列を作成
  const previewValues: ValueConfig[] = valueItems.map(item => ({
    id: item.id,
    dataSource: item.dataSource,
    value: item.value,
    seriesType: item.seriesType
  }));

  // 円グラフ用の年度リスト
  const yearOptions = useMemo(() => {
    return selectedDataSource ? getYears(selectedDataSource) : [];
  }, [selectedDataSource]);

  return (
    <div className="bg-white border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {isNew ? 'チャートを作成' : 'チャートを編集'}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          )}
          {isNew && (
            <button
              onClick={onDelete}
              className="px-3 py-1 text-xs text-gray-400 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {/* タイトル入力 */}
      <div className="p-6 border-b border-gray-100">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力してください"
          className="w-full text-xl font-semibold text-gray-900 placeholder-gray-300 border-0 border-b border-transparent focus:border-gray-300 focus:ring-0 pb-2 bg-transparent"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="説明文を入力してください"
          rows={2}
          className="w-full mt-3 text-sm text-gray-600 placeholder-gray-300 border-0 focus:ring-0 resize-none bg-transparent"
        />
      </div>

      {/* データソース選択 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="text-sm text-gray-500">データソース</span>
          </div>
          <div className="flex-1">
            <select
              value={selectedDataSource || ''}
              onChange={(e) => handleDataSourceChange(e.target.value as DataSourceId)}
              className="w-full px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
            >
              <option value="">データソースを選択</option>
              {dataSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            {selectedMeta && (
              <p className="mt-2 text-xs text-gray-400">
                {selectedMeta.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 軸情報表示 */}
      {selectedDataSource && axisInfoData && (
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">軸情報</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{axisInfoData.axisLabel}:</span>{' '}
                {axisInfoData.totalRange.length > 0 ? (
                  <>
                    {axisInfoData.totalRange[0]}
                    {axisInfoData.totalRange.length > 1 && (
                      <> 〜 {axisInfoData.totalRange[axisInfoData.totalRange.length - 1]}</>
                    )}
                    <span className="text-gray-500 ml-1">
                      ({axisInfoData.totalRange.length}件)
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>

              {/* 組み合わせ可能なソースがある場合の説明 */}
              {canCombineSources && (
                <p className="mt-2 text-xs text-blue-500">
                  同じ{axisInfoData.axisLabel}軸を持つデータソースを値ごとに選択できます
                </p>
              )}

              {/* 複数ソースの場合は各ソースの範囲も表示 */}
              {axisInfoData.sourceRanges.length > 1 && (
                <div className="mt-2 space-y-1">
                  {axisInfoData.sourceRanges.map(({ sourceId, sourceName, range }) => (
                    <div key={sourceId} className="text-xs text-gray-500">
                      <span className="inline-block w-20">{sourceName}:</span>
                      {range.length > 0 ? (
                        <>
                          {range[0]}
                          {range.length > 1 && <> 〜 {range[range.length - 1]}</>}
                          <span className="ml-1">({range.length}件)</span>
                        </>
                      ) : (
                        '-'
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 軸選択（複数軸がある場合のみ表示） */}
      {selectedDataSource && availableAxes.length > 1 && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">主軸</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableAxes.map((axis) => (
                <button
                  key={axis.type}
                  onClick={() => handleAxisChange(axis.type)}
                  className={`px-4 py-2 text-sm border transition-colors ${
                    primaryAxis === axis.type
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {axis.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* フィルタ選択（2軸データの場合） */}
      {selectedDataSource && filterAxes.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">フィルタ</span>
            </div>
            <div className="flex-1 space-y-3">
              {filterAxes.map((axis) => (
                <div key={axis.type} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-24">{axis.label}</span>
                  <select
                    value={filters.find(f => f.axisType === axis.type)?.selectedValue || ''}
                    onChange={(e) => updateFilter(axis.type, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
                  >
                    <option value="">すべて</option>
                    {getFilterOptions(axis.type).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* グラフ選択 */}
      {selectedDataSource && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">グラフを選択</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {chartTypeOptions.map((type) => {
                const isAllowed = allowedChartTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => isAllowed && setChartType(type.value)}
                    disabled={!isAllowed}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      chartType === type.value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : isAllowed
                          ? 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 円グラフ用年度選択 */}
      {chartType === 'pie' && selectedMeta?.isTimeSeries && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">表示年度</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
            >
              <option value="">最新年度</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* プレビュー */}
      {chartType && selectedDataSource && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">プレビュー</span>
            </div>
            <div className="flex-1">
              <ChartPreview
                chartType={chartType}
                values={previewValues}
                dataSource={selectedDataSource}
                primaryAxis={primaryAxis}
                filters={filters}
              />
            </div>
          </div>
        </div>
      )}

      {/* 値選択 */}
      {selectedDataSource && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm text-gray-500">値を選択</span>
            </div>
            <div className="flex-1 space-y-4">
              {valueItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-16">値{index + 1}</span>

                  {/* データソース選択（値2以降のみ変更可能、値1は選択したデータソースに固定） */}
                  {canCombineSources && (
                    index === 0 ? (
                      <span className="w-40 px-3 py-2 text-gray-500 text-sm bg-gray-50 border border-gray-200">
                        {availableSourcesForValue.find(s => s.id === item.dataSource)?.name || ''}
                      </span>
                    ) : (
                      <select
                        value={item.dataSource}
                        onChange={(e) => updateValueItem(item.id, 'dataSource', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
                      >
                        {availableSourcesForValue.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </select>
                    )
                  )}

                  {/* 値選択 */}
                  <select
                    value={item.value}
                    onChange={(e) => updateValueItem(item.id, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
                  >
                    <option value="">項目を選択</option>
                    {getDataOptions(item.dataSource).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* 棒/線の選択（棒・線グラフの場合のみ） */}
                  {(chartType === 'bar' || chartType === 'line') && (
                    <div className="flex border border-gray-200">
                      <button
                        type="button"
                        onClick={() => updateValueItem(item.id, 'seriesType', 'bar')}
                        className={`px-3 py-2 text-xs transition-colors ${
                          item.seriesType === 'bar'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        title="棒グラフ"
                      >
                        棒
                      </button>
                      <button
                        type="button"
                        onClick={() => updateValueItem(item.id, 'seriesType', 'line')}
                        className={`px-3 py-2 text-xs border-l border-gray-200 transition-colors ${
                          item.seriesType === 'line'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        title="折れ線グラフ"
                      >
                        線
                      </button>
                    </div>
                  )}

                  {valueItems.length > 1 && (
                    <button
                      onClick={() => removeValueItem(item.id)}
                      className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* 追加ボタン（円グラフは1つのみ、それ以外は無制限） */}
              {(chartType !== 'pie' || valueItems.length < 1) && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-16"></span>
                  <button
                    onClick={addValueItem}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    値を追加
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 適用ボタン */}
      <div className="p-6">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full py-3 text-sm font-medium transition-colors ${
            isValid
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isNew ? 'チャートを作成' : '変更を保存'}
        </button>
      </div>
    </div>
  );
}
