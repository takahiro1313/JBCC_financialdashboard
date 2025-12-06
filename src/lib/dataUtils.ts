import bsData from '@/data/bs.json';
import plData from '@/data/pl.json';
import indicatorsData from '@/data/indicators.json';
import segmentData from '@/data/segment.json';
import stockPriceData from '@/data/stockPrice.json';
import pbrData from '@/data/pbr.json';
import marketData from '@/data/market.json';
import shareholdersData from '@/data/shareholders.json';
import vehiclesData from '@/data/vehicles.json';
import locationsData from '@/data/locations.json';
import freightShareData from '@/data/freightShare.json';

// costBreakdownDataの代わりにPLデータから売上原価データを生成
const costBreakdownData = {
  years: plData.years,
  items: [
    {
      code: 'cost_total',
      name: '売上原価合計',
      unit: '百万円',
      isAggregate: true,
      children: ['cost_labor', 'cost_expense'],
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS')?.values[i] ?? 0]))
    },
    {
      code: 'cost_labor',
      name: '人件費',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_LABOR')?.values[i] ?? 0]))
    },
    {
      code: 'cost_expense',
      name: '経費合計',
      unit: '百万円',
      isAggregate: true,
      children: ['cost_fuel', 'cost_repair', 'cost_depreciation', 'cost_facility', 'cost_tax', 'cost_outsource', 'cost_commission', 'cost_other'],
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_EXPENSE')?.values[i] ?? 0]))
    },
    {
      code: 'cost_fuel',
      name: '燃油油脂費',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_FUEL')?.values[i] ?? 0]))
    },
    {
      code: 'cost_repair',
      name: '修繕費',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_REPAIR')?.values[i] ?? 0]))
    },
    {
      code: 'cost_depreciation',
      name: '減価償却費',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_DEPRECIATION')?.values[i] ?? 0]))
    },
    {
      code: 'cost_facility',
      name: '施設使用料',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_FACILITY')?.values[i] ?? 0]))
    },
    {
      code: 'cost_tax',
      name: '租税公課',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_TAX')?.values[i] ?? 0]))
    },
    {
      code: 'cost_outsource',
      name: '傭車費',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_OUTSOURCE')?.values[i] ?? 0]))
    },
    {
      code: 'cost_commission',
      name: '取扱手数料',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_COMMISSION')?.values[i] ?? 0]))
    },
    {
      code: 'cost_other',
      name: 'その他経費',
      unit: '百万円',
      isAggregate: false,
      values: Object.fromEntries(plData.years.map((y, i) => [y, plData.items.find(item => item.code === 'PL_COGS_OTHER')?.values[i] ?? 0]))
    }
  ]
};

import {
  BSData, PLData, IndicatorsData, DataPoint, DataSourceId, ValueConfig,
  AxisType, FilterConfig, ChartConfig
} from '@/types';
import { dataSourceMetaList, getDataSourceMeta } from '@/data/dataSourceMeta';

// 型キャスト
const bs = bsData as BSData;
const pl = plData as PLData;
const indicators = indicatorsData as IndicatorsData;

// PLの重複する項目名に区別をつけるラベルマップ（共通で使用）
const plLabelOverrides: Record<string, string> = {
  'PL_COGS_LABOR': '人件費（売上原価）',
  'PL_SGA_LABOR': '人件費（販管費）',
  'PL_COGS_DEPRECIATION': '減価償却費（売上原価）',
  'PL_SGA_DEPRECIATION': '減価償却費（販管費）',
  'PL_COGS_TAX': '租税公課（売上原価）',
  'PL_SGA_TAX': '租税公課（販管費）',
  'PL_COGS_OTHER': 'その他（売上原価）',
  'PL_SGA_OTHER': 'その他（販管費）',
  'PL_NON_OP_OTHER_INC': 'その他（営業外収益）',
  'PL_NON_OP_OTHER_EXP': 'その他（営業外費用）',
};

// ========================================
// 基本データ取得関数
// ========================================

export function getYears(sourceId?: DataSourceId): string[] {
  if (!sourceId) return bs.years;

  const meta = getDataSourceMeta(sourceId);
  const yearAxis = meta?.axes.find(a => a.type === 'year');
  return yearAxis?.values || bs.years;
}

// 複数データソースの年度を統合（最大範囲）
export function getYearsUnion(sourceIds: DataSourceId[]): string[] {
  if (sourceIds.length === 0) return bs.years;

  // 各ソースの年度を取得
  const allYearSets = sourceIds.map(id => new Set(getYears(id)));

  // 全ての年度を統合
  const unionYears = new Set<string>();
  allYearSets.forEach(yearSet => {
    yearSet.forEach(year => unionYears.add(year));
  });

  // ソート（年度順）
  return Array.from(unionYears).sort((a, b) => {
    const yearA = parseInt(a.replace(/[^0-9]/g, ''));
    const yearB = parseInt(b.replace(/[^0-9]/g, ''));
    return yearA - yearB;
  });
}

// 軸の値を統合（セグメント、地域など）
export function getAxisValuesUnion(sourceIds: DataSourceId[], axisType: AxisType): string[] {
  if (sourceIds.length === 0) return [];

  const allValueSets = sourceIds.map(id => {
    const meta = getDataSourceMeta(id);
    const axis = meta?.axes.find(a => a.type === axisType);
    return new Set(axis?.values || []);
  });

  const unionValues = new Set<string>();
  allValueSets.forEach(valueSet => {
    valueSet.forEach(val => unionValues.add(val));
  });

  return Array.from(unionValues);
}

// 同じ軸を持つデータソースを取得
export function getDataSourcesWithAxis(axisType: AxisType): DataSourceId[] {
  return dataSourceMetaList
    .filter(meta => meta.axes.some(axis => axis.type === axisType))
    .map(meta => meta.id);
}

// 軸情報の取得（表示用）
export function getAxisInfo(sourceIds: DataSourceId[], axisType: AxisType = 'year'): {
  axisLabel: string;
  totalRange: string[];
  sourceRanges: { sourceId: DataSourceId; sourceName: string; range: string[] }[];
} {
  const axisLabels: Record<AxisType, string> = {
    year: '年度',
    segment: 'セグメント',
    industry: '産業',
    region: '地域',
    location_type: '拠点種別',
    shareholder: '株主',
    vehicle_type: '車両種別',
    freight_type: '貨物種別',
    cost_category: '費目'
  };

  const totalRange = axisType === 'year'
    ? getYearsUnion(sourceIds)
    : getAxisValuesUnion(sourceIds, axisType);

  const sourceRanges = sourceIds.map(id => {
    const meta = getDataSourceMeta(id);
    const axis = meta?.axes.find(a => a.type === axisType);
    return {
      sourceId: id,
      sourceName: meta?.name || id,
      range: axis?.values || []
    };
  });

  return {
    axisLabel: axisLabels[axisType] || '軸',
    totalRange,
    sourceRanges
  };
}

export function getSegments(): string[] {
  return segmentData.segments;
}

export function getIndustries(): string[] {
  return marketData.industries;
}

export function getRegions(): string[] {
  return locationsData.regions;
}

export function getLocationTypes(): string[] {
  return locationsData.locationTypes;
}

export function getShareholders(): string[] {
  return shareholdersData.items.map(item => item.name);
}

export function getVehicleTypes(): string[] {
  return vehiclesData.vehicleTypes;
}

export function getFreightTypes(): string[] {
  return freightShareData.freightTypes;
}

// ========================================
// データソース別オプション取得
// ========================================

export function getBSOptions(): { label: string; value: string; hierarchy: string[]; isAggregate: boolean }[] {
  // BSのドリルダウン構造に基づいて並び順を定義
  const bsOrder: string[] = [
    // 資産の部
    'BS_ASSET_TOTAL',      // 資産合計
    'BS_CA_TOTAL',         // 流動資産合計（ドリルダウン可）
    'BS_CA_CASH',          //   現金及び預金
    'BS_CA_AR',            //   受取手形及び売掛金
    'BS_CA_OTHER',         //   その他
    'BS_CA_ALLOWANCE',     //   貸倒引当金
    'BS_FA_TOTAL',         // 固定資産合計（ドリルダウン可）
    'BS_FA_TANGIBLE',      //   有形固定資産合計（ドリルダウン可）
    'BS_FA_BUILDING_NET',  //     建物及び構築物
    'BS_FA_MACHINE_NET',   //     機械装置及び運搬具
    'BS_FA_EQUIPMENT_NET', //     工具器具及び備品
    'BS_FA_LAND',          //     土地
    'BS_FA_CONSTRUCTION',  //     建設仮勘定
    'BS_FA_INTANGIBLE',    //   無形固定資産
    'BS_FA_INVESTMENT',    //   投資その他の資産合計（ドリルダウン可）
    'BS_FA_SECURITIES',    //     投資有価証券
    'BS_FA_INV_OTHER',     //     その他（投資）
    // 負債の部
    'BS_LIAB_TOTAL',       // 負債合計
    'BS_CL_TOTAL',         // 流動負債合計（ドリルダウン可）
    'BS_CL_AP',            //   支払手形及び買掛金
    'BS_CL_SHORT_LOAN',    //   短期借入金
    'BS_CL_CURRENT_LTD',   //   1年以内返済予定長期借入金
    'BS_CL_TAX',           //   未払法人税等
    'BS_CL_BONUS',         //   賞与引当金
    'BS_CL_OTHER',         //   その他
    'BS_LL_TOTAL',         // 固定負債合計（ドリルダウン可）
    'BS_LL_LONG_LOAN',     //   長期借入金
    'BS_LL_DEFERRED_TAX',  //   繰延税金負債
    'BS_LL_PENSION',       //   退職給付に係る負債
    'BS_LL_OTHER',         //   その他
    // 純資産の部
    'BS_EQUITY_TOTAL',     // 純資産合計
    'BS_EQ_SHAREHOLDER',   // 株主資本合計（ドリルダウン可）
    'BS_EQ_CAPITAL',       //   資本金
    'BS_EQ_CAPITAL_SURPLUS',//  資本剰余金
    'BS_EQ_RETAINED',      //   利益剰余金
    'BS_EQ_TREASURY',      //   自己株式
    'BS_OCI_TOTAL',        // その他包括利益累計額合計（ドリルダウン可）
    'BS_OCI_SECURITIES',   //   その他有価証券評価差額金
    'BS_OCI_LAND_REVAL',   //   土地再評価差額金
    'BS_OCI_OTHER',        //   その他
  ];

  const items = bs.items.map(item => ({
    label: item.hierarchy3,
    value: item.code,
    hierarchy: [item.hierarchy1, item.hierarchy2, item.hierarchy3],
    isAggregate: item.hierarchy3.includes('合計')
  }));

  // 定義順でソート
  return items.sort((a, b) => {
    const indexA = bsOrder.indexOf(a.value);
    const indexB = bsOrder.indexOf(b.value);
    // 順序リストにない項目は最後に
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

export function getPLOptions(): { label: string; value: string; hierarchy: string[]; isAggregate: boolean }[] {
  // PLのドリルダウン構造に基づいて並び順を定義
  const plOrder: string[] = [
    // 損益計算書の構造順
    'PL_SALES',                // 売上高
    'PL_COGS',                 // 売上原価合計（ドリルダウン可）
    'PL_COGS_LABOR',           //   人件費（売上原価）
    'PL_COGS_EXPENSE',         //   経費合計（ドリルダウン可）
    'PL_COGS_FUEL',            //     燃油油脂費
    'PL_COGS_REPAIR',          //     修繕費
    'PL_COGS_DEPRECIATION',    //     減価償却費
    'PL_COGS_FACILITY',        //     施設使用料
    'PL_COGS_TAX',             //     租税公課
    'PL_COGS_OUTSOURCE',       //     傭車費
    'PL_COGS_COMMISSION',      //     取扱手数料
    'PL_COGS_OTHER',           //     その他
    'PL_GROSS_PROFIT',         // 売上総利益
    'PL_SGA',                  // 販管費合計（ドリルダウン可）
    'PL_SGA_LABOR',            //   人件費（販管費）
    'PL_SGA_ADVERTISING',      //   広告宣伝費
    'PL_SGA_TRAVEL',           //   旅費交通費
    'PL_SGA_COMMUNICATION',    //   通信費
    'PL_SGA_DEPRECIATION',     //   減価償却費
    'PL_SGA_TAX',              //   租税公課
    'PL_SGA_OTHER',            //   その他
    'PL_OPERATING_PROFIT',     // 営業利益
    'PL_NON_OP_INCOME',        // 営業外収益合計（ドリルダウン可）
    'PL_NON_OP_INTEREST_INC',  //   受取利息
    'PL_NON_OP_DIVIDEND',      //   受取配当金
    'PL_NON_OP_OTHER_INC',     //   その他
    'PL_NON_OP_EXPENSE',       // 営業外費用合計（ドリルダウン可）
    'PL_NON_OP_INTEREST_EXP',  //   支払利息
    'PL_NON_OP_OTHER_EXP',     //   その他
    'PL_ORDINARY_PROFIT',      // 経常利益
    'PL_EXTRAORDINARY_GAIN',   // 特別利益
    'PL_EXTRAORDINARY_LOSS',   // 特別損失
    'PL_PROFIT_BEFORE_TAX',    // 税引前当期純利益
    'PL_TAX',                  // 法人税等
    'PL_NET_PROFIT',           // 当期純利益
    'PL_DEPRECIATION_TOTAL',   // 減価償却費（全社）
    'PL_DIVIDEND',             // 株主配当
  ];

  const aggregateKeywords = ['合計', '売上高', '売上総利益', '営業利益', '経常利益', '純利益', '当期純利益'];
  const items = pl.items.map(item => ({
    label: plLabelOverrides[item.code] || item.hierarchy3,
    value: item.code,
    hierarchy: [item.hierarchy1, item.hierarchy2, item.hierarchy3],
    isAggregate: aggregateKeywords.some(kw => item.hierarchy3.includes(kw))
  }));

  // 定義順でソート
  return items.sort((a, b) => {
    const indexA = plOrder.indexOf(a.value);
    const indexB = plOrder.indexOf(b.value);
    // 順序リストにない項目は最後に
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

export function getIndicatorOptions(): { label: string; value: string; category: string; unit: string }[] {
  const options: { label: string; value: string; category: string; unit: string }[] = [];

  Object.entries(indicators.categories).forEach(([category, items]) => {
    items.forEach(item => {
      options.push({
        label: `${item.name}（${item.unit}）`,
        value: item.code,
        category,
        unit: item.unit
      });
    });
  });

  return options;
}

export function getSegmentOptions(): { label: string; value: string; unit: string }[] {
  return segmentData.items.map(item => ({
    label: item.name,
    value: item.code,
    unit: item.unit
  }));
}

export function getStockPriceOptions(): { label: string; value: string; unit: string }[] {
  return stockPriceData.items.map(item => ({
    label: item.name,
    value: item.code,
    unit: item.unit
  }));
}

export function getPBROptions(): { label: string; value: string; unit: string }[] {
  return pbrData.items.map(item => ({
    label: item.name,
    value: item.code,
    unit: item.unit
  }));
}

export function getMarketOptions(): { label: string; value: string; unit: string }[] {
  return marketData.items.map(item => ({
    label: item.name,
    value: item.code,
    unit: item.unit
  }));
}

export function getShareholdersOptions(): { label: string; value: string }[] {
  return [
    { label: '保有割合', value: 'ratio' },
    { label: '保有株数', value: 'shares' },
    { label: '保有株価換算額', value: 'value' }
  ];
}

export function getVehiclesOptions(): { label: string; value: string }[] {
  return vehiclesData.items.map(item => ({
    label: item.name,
    value: item.code
  }));
}

export function getLocationsOptions(): { label: string; value: string }[] {
  return locationsData.items.map(item => ({
    label: item.name,
    value: item.code
  }));
}

export function getCostBreakdownOptions(): { label: string; value: string; isAggregate: boolean }[] {
  return costBreakdownData.items.map(item => ({
    label: item.name,
    value: item.code,
    isAggregate: item.isAggregate
  }));
}

export function getFreightShareOptions(): { label: string; value: string }[] {
  return freightShareData.items.map(item => ({
    label: item.name,
    value: item.code
  }));
}

// 統合オプション取得関数
export function getDataOptions(source: DataSourceId) {
  switch (source) {
    case 'bs':
      return getBSOptions();
    case 'pl':
      return getPLOptions();
    case 'indicators':
      return getIndicatorOptions();
    case 'segment':
      return getSegmentOptions();
    case 'stock_price':
      return getStockPriceOptions();
    case 'pbr':
      return getPBROptions();
    case 'market':
      return getMarketOptions();
    case 'shareholders':
      return getShareholdersOptions();
    case 'vehicles':
      return getVehiclesOptions();
    case 'locations':
      return getLocationsOptions();
    case 'cost_breakdown':
      return getCostBreakdownOptions();
    case 'freight_share':
      return getFreightShareOptions();
    default:
      return [];
  }
}

// ========================================
// 値ラベル取得
// ========================================

export function getValueLabel(source: DataSourceId, code: string): string {
  if (source === 'bs') {
    const item = bs.items.find(item => item.code === code);
    return item?.hierarchy3 || '';
  } else if (source === 'pl') {
    // オーバーライドがあればそれを使用
    if (plLabelOverrides[code]) {
      return plLabelOverrides[code];
    }
    const item = pl.items.find(item => item.code === code);
    return item?.hierarchy3 || '';
  } else if (source === 'indicators') {
    for (const [, items] of Object.entries(indicators.categories)) {
      const item = items.find(item => item.code === code);
      if (item) return item.name;
    }
  } else if (source === 'segment') {
    const item = segmentData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'stock_price') {
    const item = stockPriceData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'pbr') {
    const item = pbrData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'market') {
    const item = marketData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'shareholders') {
    const labelMap: Record<string, string> = {
      ratio: '保有割合',
      shares: '保有株数',
      value: '保有株価換算額'
    };
    return labelMap[code] || '';
  } else if (source === 'vehicles') {
    const item = vehiclesData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'locations') {
    const item = locationsData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'cost_breakdown') {
    const item = costBreakdownData.items.find(item => item.code === code);
    return item?.name || '';
  } else if (source === 'freight_share') {
    const item = freightShareData.items.find(item => item.code === code);
    return item?.name || '';
  }
  return '';
}

// 値の単位を取得
export function getValueUnit(source: DataSourceId, code: string): string {
  if (source === 'bs' || source === 'pl') {
    return '百万円';
  } else if (source === 'indicators') {
    for (const [, items] of Object.entries(indicators.categories)) {
      const item = items.find(item => item.code === code);
      if (item) return item.unit;
    }
  } else if (source === 'segment') {
    const item = segmentData.items.find(item => item.code === code);
    return item?.unit || '';
  } else if (source === 'stock_price') {
    const item = stockPriceData.items.find(item => item.code === code);
    return item?.unit || '';
  } else if (source === 'pbr') {
    const item = pbrData.items.find(item => item.code === code);
    return item?.unit || '';
  } else if (source === 'market') {
    const item = marketData.items.find(item => item.code === code);
    return item?.unit || '';
  } else if (source === 'shareholders') {
    const unitMap: Record<string, string> = {
      ratio: '%',
      shares: '株',
      value: '億円'
    };
    return unitMap[code] || '';
  } else if (source === 'vehicles') {
    return '台';
  } else if (source === 'locations') {
    return '拠点';
  } else if (source === 'cost_breakdown') {
    return '百万円';
  } else if (source === 'freight_share') {
    return '%';
  }
  return '';
}

// ========================================
// 時系列データ取得（年度軸）
// ========================================

export function getValueData(source: DataSourceId, code: string): (number | null)[] {
  if (source === 'bs') {
    const item = bs.items.find(item => item.code === code);
    return item?.values || [];
  } else if (source === 'pl') {
    const item = pl.items.find(item => item.code === code);
    return item?.values || [];
  } else if (source === 'indicators') {
    for (const [, items] of Object.entries(indicators.categories)) {
      const item = items.find(item => item.code === code);
      if (item) return item.values;
    }
  } else if (source === 'stock_price') {
    const item = stockPriceData.items.find(item => item.code === code);
    return item?.values || [];
  } else if (source === 'pbr') {
    const item = pbrData.items.find(item => item.code === code);
    return item?.values || [];
  } else if (source === 'cost_breakdown') {
    const item = costBreakdownData.items.find(item => item.code === code);
    if (item) {
      const values = item.values as Record<string, number | null>;
      return costBreakdownData.years.map(year => values[year] ?? null);
    }
  } else if (source === 'market') {
    const item = marketData.items.find(item => item.code === code);
    if (item && typeof item.values === 'object' && !Array.isArray(item.values)) {
      const values = item.values as Record<string, number | null>;
      return marketData.years.map(year => values[year] ?? null);
    }
  } else if (source === 'segment') {
    // セグメントデータの年度軸データを取得
    // 各項目は特定のセグメントに対応しているため、年度をプレフィックスとして値を検索
    const item = segmentData.items.find(item => item.code === code);
    if (item) {
      const values = item.values as unknown as Record<string, number | null>;
      // 各年度に対応する値を取得（キーが年度で始まるものを探す）
      return segmentData.years.map(year => {
        // 年度で始まるキーを探す
        const matchingKey = Object.keys(values).find(k => k.startsWith(year + '_'));
        return matchingKey ? (values[matchingKey] ?? null) : null;
      });
    }
  } else if (source === 'locations') {
    // 拠点データの年度軸データは存在しないため空配列
    return [];
  } else if (source === 'shareholders') {
    // 株主構成は1時点データのため空配列（年度軸なし）
    return [];
  } else if (source === 'vehicles') {
    // 車両は1時点データのため空配列（年度軸なし）
    return [];
  } else if (source === 'freight_share') {
    // 運賃占有率は1時点データのため空配列（年度軸なし）
    return [];
  }
  return [];
}

// ========================================
// 2軸データ取得（セグメント、市場、拠点）
// ========================================

export function getSegmentChartData(
  code: string,
  primaryAxis: AxisType,
  filter?: FilterConfig
): { data: DataPoint[]; labels: string[] } {
  const item = segmentData.items.find(i => i.code === code);
  if (!item) return { data: [], labels: [] };

  const values = item.values as unknown as Record<string, number | null>;

  if (primaryAxis === 'year') {
    // 年度軸：セグメントでフィルタまたは全セグメント表示
    const segments = filter?.selectedValue
      ? [filter.selectedValue]
      : segmentData.segments;

    const data = segmentData.years.map(year => {
      const point: DataPoint = { year: year.replace('年3月期', '') };
      segments.forEach((seg, idx) => {
        const key = `${year}_${seg}`;
        point[`value${idx}`] = values[key] ?? null;
      });
      return point;
    });

    return { data, labels: segments };
  } else {
    // セグメント軸：年度でフィルタ
    const selectedYear = filter?.selectedValue || segmentData.years[segmentData.years.length - 1];

    const data = segmentData.segments.map(seg => {
      const key = `${selectedYear}_${seg}`;
      return {
        segment: seg,
        value0: values[key] ?? null
      };
    });

    return { data, labels: [item.name] };
  }
}

export function getLocationsChartData(
  code: string,
  primaryAxis: AxisType,
  filter?: FilterConfig
): { data: DataPoint[]; labels: string[] } {
  const item = locationsData.items.find(i => i.code === code);
  if (!item) return { data: [], labels: [] };

  const values = item.values as unknown as Record<string, number | null>;

  if (primaryAxis === 'region') {
    // 地域軸：種別でフィルタまたは合計
    const selectedType = filter?.selectedValue;

    const data = locationsData.regions.map(region => {
      if (selectedType) {
        const key = `${region}_${selectedType}`;
        return {
          region,
          value0: values[key] ?? null
        };
      } else {
        // フィルタなし：合計を表示
        const key = `${region}_合計`;
        return {
          region,
          value0: values[key] ?? null
        };
      }
    });

    return { data, labels: [item.name] };
  } else {
    // 種別軸：地域でフィルタ
    const selectedRegion = filter?.selectedValue || '関東';

    const data = locationsData.locationTypes.map(type => {
      const key = `${selectedRegion}_${type}`;
      return {
        locationType: type,
        value0: values[key] ?? null
      };
    });

    return { data, labels: [item.name] };
  }
}

// ========================================
// 1時点データ取得（株主、車両、運賃）
// ========================================

export function getShareholdersChartData(valueType: string): { data: DataPoint[]; label: string } {
  const data = shareholdersData.items.map(item => ({
    shareholder: item.name,
    value0: valueType === 'ratio' ? item.ratio :
            valueType === 'shares' ? item.shares :
            valueType === 'value' ? item.value : null
  }));

  const label = valueType === 'ratio' ? '保有割合（%）' :
                valueType === 'shares' ? '保有株数' :
                '保有株価換算額（億円）';

  return { data, label };
}

// 複数値対応の株主構成データ取得
export function getShareholdersMultiValueChartData(values: ValueConfig[]): { data: DataPoint[]; labels: Record<string, string> } {
  const validValues = values.filter(v => v.value && v.dataSource === 'shareholders');
  if (validValues.length === 0) {
    return { data: [], labels: {} };
  }

  const labels: Record<string, string> = {};
  const labelMap: Record<string, string> = {
    ratio: '保有割合（%）',
    shares: '保有株数',
    value: '保有株価換算額（億円）'
  };

  const data = shareholdersData.items.map(item => {
    const point: DataPoint = { shareholder: item.name };

    validValues.forEach((v, vIndex) => {
      const key = `value${vIndex}`;
      labels[key] = labelMap[v.value] || v.value;

      if (v.value === 'ratio') {
        point[key] = item.ratio;
      } else if (v.value === 'shares') {
        point[key] = item.shares;
      } else if (v.value === 'value') {
        point[key] = item.value;
      } else {
        point[key] = null;
      }
    });

    return point;
  });

  return { data, labels };
}

export function getVehiclesChartData(code: string): { data: DataPoint[]; label: string } {
  const item = vehiclesData.items.find(i => i.code === code);
  if (!item) return { data: [], label: '' };

  const values = item.values as unknown as Record<string, number | null>;

  const data = vehiclesData.vehicleTypes.map(type => ({
    vehicleType: type,
    value0: values[type] ?? null
  }));

  return { data, label: item.name };
}

export function getFreightShareChartData(code: string): { data: DataPoint[]; label: string } {
  const item = freightShareData.items.find(i => i.code === code);
  if (!item) return { data: [], label: '' };

  const values = item.values as unknown as Record<string, number | null>;

  const data = freightShareData.freightTypes.map(type => ({
    freightType: type,
    value0: values[type] ?? null
  }));

  return { data, label: item.name };
}

// ========================================
// 汎用チャートデータ取得
// ========================================

// カテゴリ軸データ対応のチャートデータ取得
export function getChartDataForConfig(
  dataSource: DataSourceId,
  primaryAxis: AxisType,
  values: ValueConfig[],
  filters?: FilterConfig[]
): { data: DataPoint[]; labels: Record<string, string>; xAxisKey: string } {
  // 年度軸の場合は常にgetMultiValueChartDataを使用（複数データソース対応）
  if (primaryAxis === 'year') {
    const { data, labels } = getMultiValueChartData(values);
    return { data, labels, xAxisKey: 'year' };
  }

  // 実際の値で使用されているデータソースを確認
  const actualDataSource = values[0]?.dataSource || dataSource;

  // 1時点データ（カテゴリ軸）の場合
  if (actualDataSource === 'shareholders') {
    // 複数値に対応
    const { data, labels } = getShareholdersMultiValueChartData(values);
    return {
      data,
      labels,
      xAxisKey: 'shareholder'
    };
  }

  if (actualDataSource === 'vehicles') {
    const code = values[0]?.value || '';
    const { data, label } = getVehiclesChartData(code);
    return {
      data,
      labels: { value0: label },
      xAxisKey: 'vehicleType'
    };
  }

  if (actualDataSource === 'freight_share') {
    const code = values[0]?.value || '';
    const { data, label } = getFreightShareChartData(code);
    return {
      data,
      labels: { value0: label },
      xAxisKey: 'freightType'
    };
  }

  // 2軸データ（セグメント、拠点）
  if (actualDataSource === 'segment') {
    const code = values[0]?.value || '';
    const filter = filters?.find(f => f.selectedValue);
    const { data, labels: segLabels } = getSegmentChartData(code, primaryAxis, filter);
    const labelsRecord: Record<string, string> = {};
    segLabels.forEach((label, idx) => {
      labelsRecord[`value${idx}`] = label;
    });
    return {
      data,
      labels: labelsRecord,
      xAxisKey: 'segment'
    };
  }

  if (actualDataSource === 'locations') {
    const code = values[0]?.value || '';
    const filter = filters?.find(f => f.selectedValue);
    const { data, labels: locLabels } = getLocationsChartData(code, primaryAxis, filter);
    const labelsRecord: Record<string, string> = {};
    locLabels.forEach((label, idx) => {
      labelsRecord[`value${idx}`] = label;
    });
    return {
      data,
      labels: labelsRecord,
      xAxisKey: primaryAxis === 'region' ? 'region' : 'locationType'
    };
  }

  // デフォルト（時系列データ）
  const { data, labels } = getMultiValueChartData(values);
  return { data, labels, xAxisKey: 'year' };
}

export function getMultiValueChartData(values: ValueConfig[]): { data: DataPoint[]; labels: Record<string, string> } {
  // 値がない場合は空を返す
  const validValues = values.filter(v => v.value);
  if (validValues.length === 0) {
    return { data: [], labels: {} };
  }

  // 全データソースの年度を統合（最大範囲）
  const sourceIds = Array.from(new Set(validValues.map(v => v.dataSource)));
  const unionYears = getYearsUnion(sourceIds);
  const labels: Record<string, string> = {};

  // 各データソースの年度リストをマップに保持
  const sourceYearsMap = new Map<DataSourceId, string[]>();
  sourceIds.forEach(id => {
    sourceYearsMap.set(id, getYears(id));
  });

  const data = unionYears.map((year) => {
    const point: DataPoint = {
      year: year.replace('年3月期', '').replace('年', '')
    };

    validValues.forEach((v, vIndex) => {
      const key = `value${vIndex}`;

      // ラベルは項目名を使用
      labels[key] = getValueLabel(v.dataSource, v.value);

      // このデータソースにこの年度があるか確認
      const sourceYears = sourceYearsMap.get(v.dataSource) || [];
      const yearIndex = sourceYears.indexOf(year);

      if (yearIndex === -1) {
        // この年度はこのデータソースに存在しない → null
        point[key] = null;
      } else {
        const valueData = getValueData(v.dataSource, v.value);
        point[key] = valueData[yearIndex] ?? null;
      }
    });

    return point;
  });

  return { data, labels };
}

// ========================================
// ドリルダウン関連
// ========================================

// PLの親子関係定義（階層的ドリルダウン対応）
const plDrilldownMap: Record<string, string[]> = {
  // 売上原価合計 -> 人件費、経費合計
  'PL_COGS': ['PL_COGS_LABOR', 'PL_COGS_EXPENSE'],
  // 経費合計 -> 各経費項目
  'PL_COGS_EXPENSE': ['PL_COGS_FUEL', 'PL_COGS_REPAIR', 'PL_COGS_DEPRECIATION', 'PL_COGS_FACILITY', 'PL_COGS_TAX', 'PL_COGS_OUTSOURCE', 'PL_COGS_COMMISSION', 'PL_COGS_OTHER'],
  // 販管費合計 -> 各販管費項目
  'PL_SGA': ['PL_SGA_LABOR', 'PL_SGA_ADVERTISING', 'PL_SGA_TRAVEL', 'PL_SGA_COMMUNICATION', 'PL_SGA_DEPRECIATION', 'PL_SGA_TAX', 'PL_SGA_OTHER'],
  // 営業外収益合計 -> 各営業外収益
  'PL_NON_OP_INCOME': ['PL_NON_OP_INTEREST_INC', 'PL_NON_OP_DIVIDEND', 'PL_NON_OP_OTHER_INC'],
  // 営業外費用合計 -> 各営業外費用
  'PL_NON_OP_EXPENSE': ['PL_NON_OP_INTEREST_EXP', 'PL_NON_OP_OTHER_EXP']
};

// BSの親子関係定義
const bsDrilldownMap: Record<string, string[]> = {
  // 流動資産合計 -> 各流動資産項目
  'BS_CA_TOTAL': ['BS_CA_CASH', 'BS_CA_AR', 'BS_CA_OTHER', 'BS_CA_ALLOWANCE'],
  // 有形固定資産合計 -> 各有形固定資産項目
  'BS_FA_TANGIBLE': ['BS_FA_BUILDING_NET', 'BS_FA_MACHINE_NET', 'BS_FA_EQUIPMENT_NET', 'BS_FA_LAND', 'BS_FA_CONSTRUCTION'],
  // 投資その他の資産合計 -> 各投資資産項目
  'BS_FA_INVESTMENT': ['BS_FA_SECURITIES', 'BS_FA_INV_OTHER'],
  // 固定資産合計 -> 有形固定資産、無形固定資産、投資その他
  'BS_FA_TOTAL': ['BS_FA_TANGIBLE', 'BS_FA_INTANGIBLE', 'BS_FA_INVESTMENT'],
  // 流動負債合計 -> 各流動負債項目
  'BS_CL_TOTAL': ['BS_CL_AP', 'BS_CL_SHORT_LOAN', 'BS_CL_CURRENT_LTD', 'BS_CL_TAX', 'BS_CL_BONUS', 'BS_CL_OTHER'],
  // 固定負債合計 -> 各固定負債項目
  'BS_LL_TOTAL': ['BS_LL_LONG_LOAN', 'BS_LL_DEFERRED_TAX', 'BS_LL_PENSION', 'BS_LL_OTHER'],
  // 株主資本合計 -> 各株主資本項目
  'BS_EQ_SHAREHOLDER': ['BS_EQ_CAPITAL', 'BS_EQ_CAPITAL_SURPLUS', 'BS_EQ_RETAINED', 'BS_EQ_TREASURY'],
  // その他包括利益累計額合計 -> 各包括利益項目
  'BS_OCI_TOTAL': ['BS_OCI_SECURITIES', 'BS_OCI_LAND_REVAL', 'BS_OCI_OTHER']
};

// 子から親へのマッピング（パンくず用）
const plParentMap: Record<string, string> = {};
Object.entries(plDrilldownMap).forEach(([parent, children]) => {
  children.forEach(child => {
    plParentMap[child] = parent;
  });
});

const bsParentMap: Record<string, string> = {};
Object.entries(bsDrilldownMap).forEach(([parent, children]) => {
  children.forEach(child => {
    bsParentMap[child] = parent;
  });
});

// 親階層を取得（パンくず表示用）
export function getDrilldownAncestors(dataSource: DataSourceId, code: string): { code: string; name: string }[] {
  const ancestors: { code: string; name: string }[] = [];

  if (dataSource === 'pl') {
    let currentCode = code;
    while (plParentMap[currentCode]) {
      const parentCode = plParentMap[currentCode];
      const parentItem = pl.items.find(i => i.code === parentCode);
      if (parentItem) {
        ancestors.unshift({ code: parentCode, name: parentItem.hierarchy3 });
      }
      currentCode = parentCode;
    }
  }

  if (dataSource === 'bs') {
    let currentCode = code;
    while (bsParentMap[currentCode]) {
      const parentCode = bsParentMap[currentCode];
      const parentItem = bs.items.find(i => i.code === parentCode);
      if (parentItem) {
        ancestors.unshift({ code: parentCode, name: parentItem.hierarchy3 });
      }
      currentCode = parentCode;
    }
  }

  if (dataSource === 'cost_breakdown') {
    // cost_breakdownの親子関係を取得
    const item = costBreakdownData.items.find(i => i.code === code);
    if (item) {
      // 親を探す
      const parent = costBreakdownData.items.find(p => p.children?.includes(code));
      if (parent) {
        ancestors.push({ code: parent.code, name: parent.name });
      }
    }
  }

  return ancestors;
}

export function getCostBreakdownDrilldown(parentCode: string): {
  parent: typeof costBreakdownData.items[0] | null;
  children: typeof costBreakdownData.items;
} {
  const parent = costBreakdownData.items.find(i => i.code === parentCode);
  if (!parent || !parent.isAggregate || !parent.children) {
    return { parent: null, children: [] };
  }

  const children = costBreakdownData.items.filter(i =>
    parent.children?.includes(i.code)
  );

  return { parent, children };
}

// PLのドリルダウン
export function getPLDrilldown(parentCode: string): {
  parent: { code: string; name: string; values: (number | null)[] } | null;
  children: { code: string; name: string; values: (number | null)[] }[];
  years: string[];
} {
  const childCodes = plDrilldownMap[parentCode];
  if (!childCodes) {
    return { parent: null, children: [], years: [] };
  }

  const parentItem = pl.items.find(i => i.code === parentCode);
  if (!parentItem) {
    return { parent: null, children: [], years: [] };
  }

  const children = childCodes
    .map(code => pl.items.find(i => i.code === code))
    .filter((item): item is typeof pl.items[0] => item !== undefined)
    .map(item => ({
      code: item.code,
      name: item.hierarchy3,
      values: item.values
    }));

  return {
    parent: {
      code: parentItem.code,
      name: parentItem.hierarchy3,
      values: parentItem.values
    },
    children,
    years: pl.years
  };
}

// BSのドリルダウン
export function getBSDrilldown(parentCode: string): {
  parent: { code: string; name: string; values: (number | null)[] } | null;
  children: { code: string; name: string; values: (number | null)[] }[];
  years: string[];
} {
  const childCodes = bsDrilldownMap[parentCode];
  if (!childCodes) {
    return { parent: null, children: [], years: [] };
  }

  const parentItem = bs.items.find(i => i.code === parentCode);
  if (!parentItem) {
    return { parent: null, children: [], years: [] };
  }

  const children = childCodes
    .map(code => bs.items.find(i => i.code === code))
    .filter((item): item is typeof bs.items[0] => item !== undefined)
    .map(item => ({
      code: item.code,
      name: item.hierarchy3,
      values: item.values
    }));

  return {
    parent: {
      code: parentItem.code,
      name: parentItem.hierarchy3,
      values: parentItem.values
    },
    children,
    years: bs.years
  };
}

// ドリルダウン可能かどうかを判定
export function hasDrilldownForValue(dataSource: DataSourceId, code: string): boolean {
  if (dataSource === 'cost_breakdown') {
    const item = costBreakdownData.items.find(i => i.code === code);
    return !!(item && item.isAggregate && item.children);
  }
  if (dataSource === 'pl') {
    return code in plDrilldownMap;
  }
  if (dataSource === 'bs') {
    return code in bsDrilldownMap;
  }
  return false;
}

// ========================================
// ユーティリティ
// ========================================

export function formatNumber(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined) return '-';

  if (compact && Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + '千';
  }

  return value.toLocaleString('ja-JP', {
    maximumFractionDigits: 2
  });
}

export function getDataSourceList() {
  return dataSourceMetaList.map(meta => ({
    id: meta.id,
    name: meta.name,
    description: meta.description
  }));
}

export function getAxisOptions(sourceId: DataSourceId) {
  const meta = getDataSourceMeta(sourceId);
  return meta?.axes || [];
}

export function getAllowedChartTypesForSource(sourceId: DataSourceId) {
  const meta = getDataSourceMeta(sourceId);
  return meta?.allowedChartTypes || ['bar', 'line', 'pie', 'table'];
}
