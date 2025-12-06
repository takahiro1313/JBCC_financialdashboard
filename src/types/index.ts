// ========================================
// 基本型定義
// ========================================

export type ChartType = 'bar' | 'line' | 'pie' | 'table';
export type SeriesType = 'bar' | 'line';

// データソースID
export type DataSourceId =
  | 'bs'
  | 'pl'
  | 'indicators'
  | 'cost_breakdown'      // 売上原価内訳
  | 'segment'             // セグメント業績
  | 'stock_price'         // 株価
  | 'pbr'                 // PBR
  | 'market'              // 市場データ
  | 'shareholders'        // 株主構成
  | 'vehicles'            // 車両
  | 'locations'           // 拠点
  | 'freight_share';      // 運賃占有率

// 軸タイプ
export type AxisType =
  | 'year'                // 年度
  | 'segment'             // セグメント（事業部）
  | 'industry'            // 産業
  | 'region'              // 地域
  | 'location_type'       // 拠点種別
  | 'shareholder'         // 株主
  | 'vehicle_type'        // 車両種別
  | 'freight_type'        // 貨物種別
  | 'cost_category';      // 費目

// ========================================
// データソースメタ情報
// ========================================

export interface AxisDefinition {
  type: AxisType;
  label: string;
  values: string[];       // 軸の値リスト（例：年度なら["2016年3月期", ...]）
}

export interface DataSourceMeta {
  id: DataSourceId;
  name: string;
  description: string;
  axes: AxisDefinition[];                    // 利用可能な軸
  primaryAxis: AxisType;                     // デフォルトの主軸
  compatibleSources: DataSourceId[];         // 結合可能なソース
  allowedChartTypes: ChartType[];            // 許可されるグラフ種別
  isTimeSeries: boolean;                     // 時系列データか
  isSinglePoint: boolean;                    // 1時点のみか
  hasDrilldown: boolean;                     // ドリルダウン対応か
}

// ========================================
// フィルタ・値設定
// ========================================

export interface FilterConfig {
  axisType: AxisType;
  selectedValue: string;  // フィルタで選択された値
}

export interface ValueConfig {
  id: string;
  dataSource: DataSourceId;
  value: string;
  seriesType: SeriesType;
}

// ========================================
// カード種別
// ========================================

export type CardType = 'chart' | 'bullet' | 'image';

// ========================================
// チャート設定
// ========================================

// 軸範囲設定
export interface AxisRangeConfig {
  startIndex?: number;                       // 開始インデックス（年度の場合）
  endIndex?: number;                         // 終了インデックス（年度の場合）
  selectedItems?: string[];                  // 選択された項目（カテゴリ軸の場合）
}

// Y軸モード
export type YAxisMode = 'auto' | 'shared' | 'separate';

export interface ChartConfig {
  cardType: 'chart';
  title: string;
  description: string;
  chartType: ChartType;
  dataSource: DataSourceId;                  // 選択されたデータソース
  values: ValueConfig[];
  primaryAxis: AxisType;                     // 主軸
  filters: FilterConfig[];                   // フィルタ設定
  selectedYear?: string;                     // 円グラフ用の年度選択
  axisRange?: AxisRangeConfig;               // 軸範囲設定
  yAxisMode?: YAxisMode;                     // Y軸モード（auto=自動判定, shared=共通, separate=個別）
}

// 箇条書きアイテム
export interface BulletItem {
  id: string;
  text: string;
  indent: number;                            // インデントレベル（0, 1, 2...）
}

// 箇条書きカード設定
export interface BulletCardConfig {
  cardType: 'bullet';
  title: string;
  description: string;                       // 説明文
  items: BulletItem[];                       // 箇条書きアイテム
}

// 画像カード設定
export interface ImageCardConfig {
  cardType: 'image';
  title: string;
  description: string;                       // 説明文
  imageData: string;                         // Base64エンコードされた画像データ
  caption?: string;                          // キャプション
}

// 統合カード設定型
export type CardConfig = ChartConfig | BulletCardConfig | ImageCardConfig;

// ========================================
// データ構造（既存 + 拡張）
// ========================================

export interface BSItem {
  hierarchy1: string;
  hierarchy2: string;
  hierarchy3: string;
  code: string;
  values: number[];
}

export interface PLItem {
  hierarchy1: string;
  hierarchy2: string;
  hierarchy3: string;
  code: string;
  values: number[];
}

export interface IndicatorItem {
  name: string;
  unit: string;
  code: string;
  values: (number | null)[];
}

// ドリルダウン対応の項目
export interface DrilldownItem {
  code: string;
  name: string;
  isAggregate: boolean;           // 集計項目か
  children?: string[];            // 子項目のコード
  values: { [axis: string]: number | null };  // 軸ごとの値
}

// 2軸データ用の汎用項目
export interface MultiAxisItem {
  code: string;
  name: string;
  values: { [axisKey: string]: number | null };  // "2024_segment1": 100 のような形式
}

// ========================================
// データファイル構造
// ========================================

export interface BSData {
  years: string[];
  items: BSItem[];
}

export interface PLData {
  years: string[];
  items: PLItem[];
}

export interface IndicatorsData {
  years: string[];
  categories: {
    [key: string]: IndicatorItem[];
  };
}

// 売上原価内訳
export interface CostBreakdownData {
  years: string[];
  items: DrilldownItem[];
}

// セグメント業績
export interface SegmentData {
  years: string[];
  segments: string[];
  items: MultiAxisItem[];
}

// 株価
export interface StockPriceData {
  years: string[];
  items: {
    code: string;
    name: string;
    values: (number | null)[];
  }[];
}

// PBR
export interface PBRData {
  years: string[];
  items: {
    code: string;
    name: string;
    values: (number | null)[];
  }[];
}

// 市場データ
export interface MarketData {
  years: string[];
  industries: string[];
  items: MultiAxisItem[];
}

// 株主構成
export interface ShareholdersData {
  shareholders: string[];
  items: {
    code: string;
    name: string;
    values: { [shareholder: string]: number | null };
  }[];
}

// 車両
export interface VehiclesData {
  vehicleTypes: string[];
  items: {
    code: string;
    name: string;
    values: { [vehicleType: string]: number | null };
  }[];
}

// 拠点
export interface LocationsData {
  regions: string[];
  locationTypes: string[];
  items: MultiAxisItem[];
}

// 運賃占有率
export interface FreightShareData {
  freightTypes: string[];
  items: {
    code: string;
    name: string;
    values: { [freightType: string]: number | null };
  }[];
}

// ========================================
// 汎用データポイント
// ========================================

export interface DataPoint {
  [key: string]: string | number | null;
}
