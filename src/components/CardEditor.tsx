'use client';

import { useState, useMemo } from 'react';
import { CardConfig, CardType, ChartConfig, BulletCardConfig, ImageCardConfig, ChartType as ChartTypeEnum, DataSourceId, SeriesType, ValueConfig, AxisType, FilterConfig, AxisRangeConfig, YAxisMode } from '@/types';
import { getDataOptions, getDataSourceList, getAxisOptions, getAllowedChartTypesForSource, getYears, getSegments, getRegions, getLocationTypes, getAxisInfo, getDataSourcesWithAxis, hasDrilldownForValue } from '@/lib/dataUtils';
import { getDataSourceMeta } from '@/data/dataSourceMeta';
import ChartPreview from './ChartPreview';
import BulletCard from './BulletCard';
import ImageCardEditor from './ImageCardEditor';

interface ValueItem {
  id: string;
  dataSource: DataSourceId;
  value: string;
  seriesType: SeriesType;
}

interface CardEditorProps {
  initialConfig?: CardConfig | null;
  onSubmit: (config: CardConfig) => void;
  onCancel?: () => void;
  onDelete: () => void;
  isNew: boolean;
}

export default function CardEditor({
  initialConfig,
  onSubmit,
  onCancel,
  onDelete,
  isNew
}: CardEditorProps) {
  // カード種別（デフォルトはグラフ）
  const [cardType, setCardType] = useState<CardType>(initialConfig?.cardType || 'chart');

  // 基本情報（全カード共通）
  const [title, setTitle] = useState(initialConfig?.title || '');
  const [description, setDescription] = useState(
    initialConfig?.cardType === 'chart' ? (initialConfig as ChartConfig).description :
    initialConfig?.cardType === 'bullet' ? (initialConfig as BulletCardConfig).description :
    initialConfig?.cardType === 'image' ? (initialConfig as ImageCardConfig).description : ''
  );

  // チャート用設定
  const chartConfig = initialConfig?.cardType === 'chart' ? initialConfig as ChartConfig : null;

  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceId | null>(
    chartConfig?.dataSource || null
  );
  const [primaryAxis, setPrimaryAxis] = useState<AxisType>(
    chartConfig?.primaryAxis || 'year'
  );
  const [filters, setFilters] = useState<FilterConfig[]>(
    chartConfig?.filters || []
  );
  const [chartTypeSelection, setChartTypeSelection] = useState<ChartTypeEnum | null>(
    chartConfig?.chartType || null
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    chartConfig?.selectedYear || ''
  );
  const [axisRange, setAxisRange] = useState<AxisRangeConfig>(
    chartConfig?.axisRange || {}
  );
  const [yAxisMode, setYAxisMode] = useState<YAxisMode>(
    chartConfig?.yAxisMode || 'auto'
  );
  const [valueItems, setValueItems] = useState<ValueItem[]>(() => {
    if (chartConfig?.values) {
      return chartConfig.values.map((v, index) => ({
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
    const sourcesWithSameAxis = getDataSourcesWithAxis(primaryAxis);
    return dataSources.filter(s => sourcesWithSameAxis.includes(s.id as DataSourceId));
  }, [selectedDataSource, primaryAxis, dataSources]);

  const canCombineSources = useMemo(() => {
    return availableSourcesForValue.length > 1;
  }, [availableSourcesForValue]);

  const availableAxes = useMemo(() => {
    return selectedDataSource ? getAxisOptions(selectedDataSource) : [];
  }, [selectedDataSource]);

  const allowedChartTypes = useMemo(() => {
    if (!selectedDataSource) return ['bar', 'line', 'pie', 'table'];
    return getAllowedChartTypesForSource(selectedDataSource);
  }, [selectedDataSource]);

  const chartTypeOptions: { value: ChartTypeEnum; label: string }[] = [
    { value: 'bar', label: '棒グラフ' },
    { value: 'pie', label: '円グラフ' },
    { value: 'table', label: '表' }
  ];

  const filterAxes = useMemo(() => {
    return availableAxes.filter(axis => axis.type !== primaryAxis);
  }, [availableAxes, primaryAxis]);

  const usedDataSources = useMemo(() => {
    const sources = valueItems
      .filter(item => item.value)
      .map(item => item.dataSource);
    return Array.from(new Set(sources));
  }, [valueItems]);

  const axisInfoData = useMemo(() => {
    if (!selectedDataSource) return null;
    const sourcesToCheck = usedDataSources.length > 0 ? usedDataSources : [selectedDataSource];
    return getAxisInfo(sourcesToCheck, primaryAxis);
  }, [selectedDataSource, primaryAxis, usedDataSources]);

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

  const handleDataSourceChange = (sourceId: DataSourceId) => {
    setSelectedDataSource(sourceId);
    const meta = getDataSourceMeta(sourceId);
    setPrimaryAxis(meta?.primaryAxis || 'year');
    setFilters([]);
    setChartTypeSelection(null);
    setValueItems([{ id: '1', dataSource: sourceId, value: '', seriesType: 'bar' }]);
    setSelectedYear('');
    setAxisRange({});
    setYAxisMode('auto');
  };

  const handleAxisChange = (axisType: AxisType) => {
    setPrimaryAxis(axisType);
    setFilters([]);
    setAxisRange({});
  };

  const updateFilter = (axisType: AxisType, value: string) => {
    setFilters(prev => {
      const existing = prev.find(f => f.axisType === axisType);
      if (existing) {
        return prev.map(f => f.axisType === axisType ? { ...f, selectedValue: value } : f);
      }
      return [...prev, { axisType, selectedValue: value }];
    });
  };

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

  // チャート送信
  const handleChartSubmit = () => {
    if (!title || !chartTypeSelection || !selectedDataSource || !valueItems[0]?.value) return;

    const values: ValueConfig[] = valueItems
      .filter(item => item.value)
      .map(item => ({
        id: item.id,
        dataSource: item.dataSource,
        value: item.value,
        seriesType: item.seriesType
      }));

    // 軸範囲が設定されているか確認
    const hasAxisRange = axisRange.startIndex !== undefined ||
                         axisRange.endIndex !== undefined ||
                         (axisRange.selectedItems && axisRange.selectedItems.length > 0);

    const config: ChartConfig = {
      cardType: 'chart',
      title,
      description,
      chartType: chartTypeSelection,
      dataSource: selectedDataSource,
      values,
      primaryAxis,
      filters,
      selectedYear: chartTypeSelection === 'pie' && selectedMeta?.isTimeSeries ? selectedYear : undefined,
      axisRange: hasAxisRange ? axisRange : undefined,
      yAxisMode: yAxisMode !== 'auto' ? yAxisMode : undefined
    };

    onSubmit(config);
  };

  // 箇条書き送信
  const handleBulletSubmit = (config: BulletCardConfig) => {
    onSubmit(config);
  };

  // 画像送信
  const handleImageSubmit = (config: ImageCardConfig) => {
    onSubmit(config);
  };

  // カード種別切り替え
  const handleCardTypeChange = (newType: CardType) => {
    setCardType(newType);
  };

  const isChartValid = title && chartTypeSelection && selectedDataSource && valueItems[0]?.value;

  const previewValues: ValueConfig[] = valueItems.map(item => ({
    id: item.id,
    dataSource: item.dataSource,
    value: item.value,
    seriesType: item.seriesType
  }));

  const yearOptions = useMemo(() => {
    return selectedDataSource ? getYears(selectedDataSource) : [];
  }, [selectedDataSource]);

  return (
    <div className="bg-white border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {isNew ? 'カードを作成' : 'カードを編集'}
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

        {/* カード種別切り替えアイコン（説明文の下、右寄せ） */}
        <div className="flex justify-end items-center gap-1 mt-2">
          <span className="text-xs text-gray-400 mr-2">種別:</span>
          <button
            onClick={() => handleCardTypeChange('chart')}
            className={`p-1.5 rounded transition-colors ${
              cardType === 'chart'
                ? 'bg-gray-200 text-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="グラフ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={() => handleCardTypeChange('bullet')}
            className={`p-1.5 rounded transition-colors ${
              cardType === 'bullet'
                ? 'bg-gray-200 text-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="箇条書き"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <button
            onClick={() => handleCardTypeChange('image')}
            className={`p-1.5 rounded transition-colors ${
              cardType === 'image'
                ? 'bg-gray-200 text-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="画像"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* カード種別に応じたコンテンツ */}
      {cardType === 'chart' && (
        <>
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
                <div className="flex-1 flex items-start justify-between gap-4">
                  {/* 左側：軸情報 */}
                  <div>
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
                    {canCombineSources && (
                      <p className="mt-2 text-xs text-blue-500">
                        同じ{axisInfoData.axisLabel}軸を持つデータソースを値ごとに選択できます
                      </p>
                    )}
                  </div>
                  {/* 右側：表示範囲 */}
                  {axisInfoData.totalRange.length > 1 && primaryAxis === 'year' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">表示範囲:</span>
                      <select
                        value={axisRange.startIndex ?? ''}
                        onChange={(e) => setAxisRange(prev => ({
                          ...prev,
                          startIndex: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="px-2 py-1 pr-6 border border-gray-200 text-gray-700 text-xs bg-white focus:outline-none focus:border-gray-400 appearance-none bg-no-repeat bg-right"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.25rem center' }}
                      >
                        <option value="">最初</option>
                        {axisInfoData.totalRange.map((item, index) => (
                          <option key={index} value={index}>
                            {item.replace('年3月期', '')}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-xs">〜</span>
                      <select
                        value={axisRange.endIndex ?? ''}
                        onChange={(e) => setAxisRange(prev => ({
                          ...prev,
                          endIndex: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="px-2 py-1 pr-6 border border-gray-200 text-gray-700 text-xs bg-white focus:outline-none focus:border-gray-400 appearance-none bg-no-repeat bg-right"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.25rem center' }}
                      >
                        <option value="">最後</option>
                        {axisInfoData.totalRange.map((item, index) => (
                          <option key={index} value={index}>
                            {item.replace('年3月期', '')}
                          </option>
                        ))}
                      </select>
                      {(axisRange.startIndex !== undefined || axisRange.endIndex !== undefined) && (
                        <button
                          onClick={() => setAxisRange(prev => ({ ...prev, startIndex: undefined, endIndex: undefined }))}
                          className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* カテゴリ軸の場合の項目選択（別行） */}
              {axisInfoData.totalRange.length > 1 && primaryAxis !== 'year' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className="text-xs text-gray-500">表示項目</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {axisInfoData.totalRange.map((item) => {
                          const isSelected = axisRange.selectedItems?.includes(item) ?? false;
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                setAxisRange(prev => {
                                  const current = prev.selectedItems || [];
                                  if (isSelected) {
                                    return { ...prev, selectedItems: current.filter(i => i !== item) };
                                  } else {
                                    return { ...prev, selectedItems: [...current, item] };
                                  }
                                });
                              }}
                              className={`px-2 py-1 text-xs border transition-colors ${
                                isSelected
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        {axisRange.selectedItems && axisRange.selectedItems.length > 0 ? (
                          <>
                            <span>{axisRange.selectedItems.length}件選択</span>
                            <button
                              onClick={() => setAxisRange(prev => ({ ...prev, selectedItems: undefined }))}
                              className="hover:text-gray-600"
                            >
                              クリア
                            </button>
                          </>
                        ) : (
                          <span>未選択=全表示</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Y軸設定（複数値選択時のみ表示） */}
          {selectedDataSource && (chartTypeSelection === 'bar' || chartTypeSelection === 'line') && valueItems.filter(v => v.value).length > 1 && (
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-sm text-gray-500">Y軸</span>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { value: 'auto', label: '自動' },
                    { value: 'shared', label: '共通軸' },
                    { value: 'separate', label: '個別軸' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setYAxisMode(option.value as YAxisMode)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        yAxisMode === option.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 ml-2">
                    {yAxisMode === 'auto' && '（同じ単位なら共通）'}
                    {yAxisMode === 'shared' && '（1つのY軸を共有）'}
                    {yAxisMode === 'separate' && '（左右に分離）'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 軸選択 */}
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

          {/* フィルタ選択 */}
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
                        onClick={() => isAllowed && setChartTypeSelection(type.value)}
                        disabled={!isAllowed}
                        className={`px-4 py-2 text-sm border transition-colors ${
                          chartTypeSelection === type.value
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
          {chartTypeSelection === 'pie' && selectedMeta?.isTimeSeries && (
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
          {chartTypeSelection && selectedDataSource && (
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-sm text-gray-500">プレビュー</span>
                </div>
                <div className="flex-1">
                  {/* Y軸設定（複数値選択時のみ表示）- グラフ右上 */}
                  {(chartTypeSelection === 'bar' || chartTypeSelection === 'line') && valueItems.filter(v => v.value).length > 1 && (
                    <div className="flex justify-end mb-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400 mr-1">Y軸:</span>
                        {[
                          { value: 'auto', label: '自動' },
                          { value: 'shared', label: '共通' },
                          { value: 'separate', label: '個別' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setYAxisMode(option.value as YAxisMode)}
                            className={`px-2 py-0.5 border transition-colors ${
                              yAxisMode === option.value
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <ChartPreview
                    chartType={chartTypeSelection}
                    values={previewValues}
                    dataSource={selectedDataSource}
                    primaryAxis={primaryAxis}
                    filters={filters}
                    axisRange={axisRange}
                    yAxisMode={yAxisMode}
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
                      <select
                        value={item.value}
                        onChange={(e) => updateValueItem(item.id, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
                      >
                        <option value="">項目を選択</option>
                        {getDataOptions(item.dataSource).map((option) => {
                          // ドリルダウン可能な項目に↓マークをつける
                          const canDrilldown = hasDrilldownForValue(item.dataSource, option.value);
                          return (
                            <option key={option.value} value={option.value}>
                              {canDrilldown ? '↓ ' : ''}{option.label}
                            </option>
                          );
                        })}
                      </select>
                      {(chartTypeSelection === 'bar' || chartTypeSelection === 'line') && (
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
                  {(chartTypeSelection !== 'pie' || valueItems.length < 1) && (
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
              onClick={handleChartSubmit}
              disabled={!isChartValid}
              className={`w-full py-3 text-sm font-medium transition-colors ${
                isChartValid
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isNew ? 'カードを作成' : '変更を保存'}
            </button>
          </div>
        </>
      )}

      {cardType === 'bullet' && (
        <div className="p-6">
          <BulletCard
            config={initialConfig?.cardType === 'bullet' ? initialConfig as BulletCardConfig : null}
            title={title}
            description={description}
            onSubmit={handleBulletSubmit}
            onDelete={onDelete}
            onBack={() => setCardType('chart')}
          />
        </div>
      )}

      {cardType === 'image' && (
        <div className="p-6">
          <ImageCardEditor
            config={initialConfig?.cardType === 'image' ? initialConfig as ImageCardConfig : null}
            title={title}
            description={description}
            onSubmit={handleImageSubmit}
            onDelete={onDelete}
            onBack={() => setCardType('chart')}
          />
        </div>
      )}
    </div>
  );
}
