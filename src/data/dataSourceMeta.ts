import { DataSourceMeta, DataSourceId } from '@/types';
import shareholdersData from './shareholders.json';
import vehiclesData from './vehicles.json';
import freightShareData from './freightShare.json';

// 年度リスト（共通）
const YEARS_10 = [
  '2016年3月期', '2017年3月期', '2018年3月期', '2019年3月期', '2020年3月期',
  '2021年3月期', '2022年3月期', '2023年3月期', '2024年3月期', '2025年3月期'
];

const YEARS_5 = ['2021年3月期', '2022年3月期', '2023年3月期', '2024年3月期', '2025年3月期'];
const YEARS_6 = ['2020年3月期', '2021年3月期', '2022年3月期', '2023年3月期', '2024年3月期', '2025年3月期'];

// セグメント
const SEGMENTS = ['国内運送（トラック）', 'ロジスティクス・3PL', '国際運送', 'その他'];

// 産業
const INDUSTRIES = ['運輸・倉庫', '製造業', '卸売業', '小売業', '建設業', 'その他'];

// 地域
const REGIONS = [
  '本社', '東京', '大阪', '名古屋', '福岡', '札幌', '仙台', '広島',  // 国内8拠点
  'シンガポール', '上海', 'バンコク'  // 海外3拠点
];

// 拠点種別
const LOCATION_TYPES = ['本社・営業所', '物流センター', '海外拠点'];

// 株主（実データから取得）
const SHAREHOLDERS = shareholdersData.items.map(item => item.name);

// 車両種別（実データから取得）
const VEHICLE_TYPES = vehiclesData.vehicleTypes;

// 貨物種別（実データから取得）
const FREIGHT_TYPES = freightShareData.freightTypes;

// 費目
const COST_CATEGORIES = [
  '燃料費', '人件費', '車両維持費', '保険料', '減価償却費',
  '外注費', '荷役費', '倉庫費', 'その他'
];

// データソースメタ定義
export const dataSourceMetaList: DataSourceMeta[] = [
  // ========================================
  // 時系列データ（結合可能グループ）
  // ========================================
  {
    id: 'bs',
    name: '貸借対照表（BS）',
    description: '資産・負債・純資産の状況',
    axes: [{ type: 'year', label: '年度', values: YEARS_10 }],
    primaryAxis: 'year',
    compatibleSources: ['pl', 'indicators'],
    allowedChartTypes: ['bar', 'line', 'pie', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: true
  },
  {
    id: 'pl',
    name: '損益計算書（PL）',
    description: '売上・費用・利益の状況',
    axes: [{ type: 'year', label: '年度', values: YEARS_10 }],
    primaryAxis: 'year',
    compatibleSources: ['bs', 'indicators'],
    allowedChartTypes: ['bar', 'line', 'pie', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: true
  },
  {
    id: 'indicators',
    name: '財務指標',
    description: 'ROE、ROA、PBRなどの経営指標',
    axes: [{ type: 'year', label: '年度', values: YEARS_10 }],
    primaryAxis: 'year',
    compatibleSources: ['bs', 'pl'],
    allowedChartTypes: ['bar', 'line', 'pie', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: false
  },

  // ========================================
  // 時系列データ（単独のみ）
  // ========================================
  {
    id: 'cost_breakdown',
    name: '売上原価内訳',
    description: '売上原価の費目別内訳',
    axes: [{ type: 'year', label: '年度', values: YEARS_10 }],
    primaryAxis: 'year',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'line', 'pie', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: true
  },
  {
    id: 'segment',
    name: 'セグメント業績',
    description: '事業部門別の業績',
    axes: [
      { type: 'year', label: '年度', values: YEARS_5 },
      { type: 'segment', label: 'セグメント', values: SEGMENTS }
    ],
    primaryAxis: 'year',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'line', 'pie', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: false
  },
  {
    id: 'stock_price',
    name: '株価',
    description: '株価推移',
    axes: [{ type: 'year', label: '年度', values: YEARS_6 }],
    primaryAxis: 'year',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'line', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: false
  },
  {
    id: 'pbr',
    name: 'PBR',
    description: 'PBR推移と業界比較',
    axes: [{ type: 'year', label: '年度', values: YEARS_6 }],
    primaryAxis: 'year',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'line', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: false
  },
  {
    id: 'market',
    name: '市場データ',
    description: '産業別市場規模',
    axes: [
      { type: 'year', label: '年度', values: YEARS_10.concat(['2026年', '2027年', '2028年', '2029年']) },
      { type: 'industry', label: '産業', values: INDUSTRIES }
    ],
    primaryAxis: 'year',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'line', 'pie', 'table'],
    isTimeSeries: true,
    isSinglePoint: false,
    hasDrilldown: false
  },

  // ========================================
  // 1時点データ（単独のみ）
  // ========================================
  {
    id: 'shareholders',
    name: '株主構成',
    description: '株主別持株比率',
    axes: [{ type: 'shareholder', label: '株主', values: SHAREHOLDERS }],
    primaryAxis: 'shareholder',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'pie', 'table'],  // 折れ線は不可
    isTimeSeries: false,
    isSinglePoint: true,
    hasDrilldown: false
  },
  {
    id: 'vehicles',
    name: '車両',
    description: '車両種別台数',
    axes: [{ type: 'vehicle_type', label: '車両種別', values: VEHICLE_TYPES }],
    primaryAxis: 'vehicle_type',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'pie', 'table'],  // 折れ線は不可
    isTimeSeries: false,
    isSinglePoint: true,
    hasDrilldown: false
  },
  {
    id: 'locations',
    name: '拠点',
    description: '地域別・種別別拠点情報',
    axes: [
      { type: 'region', label: '地域', values: REGIONS },
      { type: 'location_type', label: '拠点種別', values: LOCATION_TYPES }
    ],
    primaryAxis: 'region',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'pie', 'table'],  // 折れ線は不可
    isTimeSeries: false,
    isSinglePoint: true,
    hasDrilldown: false
  },
  {
    id: 'freight_share',
    name: '運賃占有率',
    description: '貨物種別の運賃占有率',
    axes: [{ type: 'freight_type', label: '貨物種別', values: FREIGHT_TYPES }],
    primaryAxis: 'freight_type',
    compatibleSources: [],
    allowedChartTypes: ['bar', 'pie', 'table'],  // 折れ線は不可
    isTimeSeries: false,
    isSinglePoint: true,
    hasDrilldown: false
  }
];

// ヘルパー関数
export function getDataSourceMeta(id: DataSourceId): DataSourceMeta | undefined {
  return dataSourceMetaList.find(meta => meta.id === id);
}

export function getCompatibleSources(id: DataSourceId): DataSourceId[] {
  const meta = getDataSourceMeta(id);
  return meta?.compatibleSources || [];
}

export function getAllowedChartTypes(id: DataSourceId): string[] {
  const meta = getDataSourceMeta(id);
  return meta?.allowedChartTypes || ['bar', 'line', 'pie', 'table'];
}

export function getAvailableAxes(id: DataSourceId) {
  const meta = getDataSourceMeta(id);
  return meta?.axes || [];
}

export function isSinglePointData(id: DataSourceId): boolean {
  const meta = getDataSourceMeta(id);
  return meta?.isSinglePoint || false;
}

export function hasDrilldown(id: DataSourceId): boolean {
  const meta = getDataSourceMeta(id);
  return meta?.hasDrilldown || false;
}
