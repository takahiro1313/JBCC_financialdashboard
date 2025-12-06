// RAG用ドキュメント生成
// 財務データを検索可能なテキストドキュメントに変換

import bsData from '@/data/bs.json';
import plData from '@/data/pl.json';
import indicatorsData from '@/data/indicators.json';
import segmentData from '@/data/segment.json';
import shareholdersData from '@/data/shareholders.json';
import vehiclesData from '@/data/vehicles.json';
import locationsData from '@/data/locations.json';
import marketData from '@/data/market.json';

export interface RAGDocument {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

// 数値をフォーマット
const formatNum = (val: number | null | undefined, unit?: string): string => {
  if (val === null || val === undefined) return 'N/A';
  const formatted = val.toLocaleString('ja-JP');
  return unit ? `${formatted}${unit}` : formatted;
};

// PLドキュメント生成
function generatePLDocuments(): RAGDocument[] {
  const docs: RAGDocument[] = [];
  const years = plData.years;

  // 主要指標サマリー
  const salesItem = plData.items.find(i => i.code === 'PL_SALES');
  const opItem = plData.items.find(i => i.code === 'PL_OPERATING_PROFIT');
  const npItem = plData.items.find(i => i.code === 'PL_NET_PROFIT');
  const cogsItem = plData.items.find(i => i.code === 'PL_COGS');
  const sgaItem = plData.items.find(i => i.code === 'PL_SGA');
  const ordinaryItem = plData.items.find(i => i.code === 'PL_ORDINARY_PROFIT');

  if (salesItem && opItem && npItem) {
    const latestYear = years[years.length - 1];
    const latestIdx = years.length - 1;
    const prevIdx = years.length - 2;

    docs.push({
      id: 'pl_summary',
      category: '損益計算書',
      title: '損益計算書サマリー',
      content: `菜の花運輸の損益計算書（PL）の概要です。

【${latestYear}実績】
- 売上高: ${formatNum(salesItem.values[latestIdx], '百万円')}（前年比${formatNum(((salesItem.values[latestIdx] - salesItem.values[prevIdx]) / salesItem.values[prevIdx] * 100), '%')}）
- 売上原価: ${formatNum(cogsItem?.values[latestIdx], '百万円')}
- 販管費: ${formatNum(sgaItem?.values[latestIdx], '百万円')}
- 営業利益: ${formatNum(opItem.values[latestIdx], '百万円')}（前年比${formatNum(((opItem.values[latestIdx] - opItem.values[prevIdx]) / opItem.values[prevIdx] * 100), '%')}）
- 経常利益: ${formatNum(ordinaryItem?.values[latestIdx], '百万円')}
- 当期純利益: ${formatNum(npItem.values[latestIdx], '百万円')}

【10年間の推移】
${years.map((y, i) => `${y}: 売上高${formatNum(salesItem.values[i], '百万円')}, 営業利益${formatNum(opItem.values[i], '百万円')}, 純利益${formatNum(npItem.values[i], '百万円')}`).join('\n')}

【分析ポイント】
- 売上高は2016年の約3,054億円から2025年は約3,629億円に成長
- 営業利益は2024年に大幅減少（125億円）、2025年も88億円と低迷
- 売上原価率が上昇傾向にあり、収益性が悪化`,
      keywords: ['売上高', '営業利益', '当期純利益', '経常利益', 'PL', '損益', '収益', '利益', '推移', '成長']
    });
  }

  // 売上原価の内訳
  const cogsLabor = plData.items.find(i => i.code === 'PL_COGS_LABOR');
  const cogsExpense = plData.items.find(i => i.code === 'PL_COGS_EXPENSE');
  const cogsFuel = plData.items.find(i => i.code === 'PL_COGS_FUEL');
  const cogsOutsource = plData.items.find(i => i.code === 'PL_COGS_OUTSOURCE');
  const cogsCommission = plData.items.find(i => i.code === 'PL_COGS_COMMISSION');

  docs.push({
    id: 'pl_cogs_breakdown',
    category: '損益計算書',
    title: '売上原価の内訳',
    content: `菜の花運輸の売上原価の構成です。

【2025年3月期の売上原価内訳】
- 売上原価合計: ${formatNum(cogsItem?.values[9], '百万円')}
- 人件費: ${formatNum(cogsLabor?.values[9], '百万円')}（売上原価の約29%）
- 経費合計: ${formatNum(cogsExpense?.values[9], '百万円')}（売上原価の約71%）
  - 燃油油脂費: ${formatNum(cogsFuel?.values[9], '百万円')}
  - 傭車費: ${formatNum(cogsOutsource?.values[9], '百万円')}（最大の経費項目）
  - 取扱手数料: ${formatNum(cogsCommission?.values[9], '百万円')}

【傾向】
- 人件費は年々増加傾向（2016年710億円→2025年1,001億円、約41%増）
- 傭車費は外部委託コストで売上原価の主要部分を占める
- 燃油油脂費は原油価格に連動`,
    keywords: ['売上原価', '人件費', '経費', '燃油', '傭車費', 'コスト', '費用', '内訳']
  });

  // 販管費の内訳
  const sgaLabor = plData.items.find(i => i.code === 'PL_SGA_LABOR');
  const sgaAd = plData.items.find(i => i.code === 'PL_SGA_ADVERTISING');
  const sgaTravel = plData.items.find(i => i.code === 'PL_SGA_TRAVEL');
  const sgaComm = plData.items.find(i => i.code === 'PL_SGA_COMMUNICATION');
  const sgaDep = plData.items.find(i => i.code === 'PL_SGA_DEPRECIATION');
  const sgaOther = plData.items.find(i => i.code === 'PL_SGA_OTHER');

  docs.push({
    id: 'pl_sga_breakdown',
    category: '損益計算書',
    title: '販管費の内訳',
    content: `菜の花運輸の販売費及び一般管理費（販管費）の内訳です。

【2025年3月期の販管費内訳】
- 販管費合計: ${formatNum(sgaItem?.values[9], '百万円')}
- 人件費: ${formatNum(sgaLabor?.values[9], '百万円')}（販管費の約60%）
- 広告宣伝費: ${formatNum(sgaAd?.values[9], '百万円')}
- 旅費交通費: ${formatNum(sgaTravel?.values[9], '百万円')}
- 通信費: ${formatNum(sgaComm?.values[9], '百万円')}
- 減価償却費: ${formatNum(sgaDep?.values[9], '百万円')}
- その他: ${formatNum(sgaOther?.values[9], '百万円')}

【10年間の販管費推移】
${years.map((y, i) => `${y}: ${formatNum(sgaItem?.values[i], '百万円')}`).join('\n')}

【傾向】
- 販管費は売上高の約3%程度で安定推移
- 人件費が販管費の過半を占める`,
    keywords: ['販管費', '販売費', '一般管理費', 'SGA', '広告', '人件費']
  });

  // 営業外損益
  const nonOpIncome = plData.items.find(i => i.code === 'PL_NON_OP_INCOME');
  const nonOpExpense = plData.items.find(i => i.code === 'PL_NON_OP_EXPENSE');
  const interestInc = plData.items.find(i => i.code === 'PL_NON_OP_INTEREST_INC');
  const dividend = plData.items.find(i => i.code === 'PL_NON_OP_DIVIDEND');
  const interestExp = plData.items.find(i => i.code === 'PL_NON_OP_INTEREST_EXP');

  docs.push({
    id: 'pl_non_operating',
    category: '損益計算書',
    title: '営業外損益の内訳',
    content: `菜の花運輸の営業外収益・費用の内訳です。

【2025年3月期の営業外損益】
■営業外収益: ${formatNum(nonOpIncome?.values[9], '百万円')}
- 受取利息: ${formatNum(interestInc?.values[9], '百万円')}
- 受取配当金: ${formatNum(dividend?.values[9], '百万円')}

■営業外費用: ${formatNum(nonOpExpense?.values[9], '百万円')}
- 支払利息: ${formatNum(interestExp?.values[9], '百万円')}

【傾向】
- 受取配当金は増加傾向（2016年1,130百万円→2025年2,101百万円）
- 営業外収益が営業外費用を上回り、経常利益にプラス寄与`,
    keywords: ['営業外', '受取配当金', '受取利息', '支払利息', '経常利益']
  });

  // 特別損益
  const extraGain = plData.items.find(i => i.code === 'PL_EXTRAORDINARY_GAIN');
  const extraLoss = plData.items.find(i => i.code === 'PL_EXTRAORDINARY_LOSS');
  const profitBeforeTax = plData.items.find(i => i.code === 'PL_PROFIT_BEFORE_TAX');
  const tax = plData.items.find(i => i.code === 'PL_TAX');

  docs.push({
    id: 'pl_extraordinary',
    category: '損益計算書',
    title: '特別損益と税金',
    content: `菜の花運輸の特別損益と法人税等の内訳です。

【2025年3月期】
- 特別利益: ${formatNum(extraGain?.values[9], '百万円')}
- 特別損失: ${formatNum(extraLoss?.values[9], '百万円')}
- 税引前当期純利益: ${formatNum(profitBeforeTax?.values[9], '百万円')}
- 法人税等: ${formatNum(tax?.values[9], '百万円')}
- 当期純利益: ${formatNum(npItem?.values[9], '百万円')}

【10年間の当期純利益推移】
${years.map((y, i) => `${y}: ${formatNum(npItem?.values[i], '百万円')}`).join('\n')}

【傾向】
- 2023年3月期は特別利益10,688百万円で純利益が大幅増
- 実効税率は約40〜46%で推移`,
    keywords: ['特別利益', '特別損失', '法人税', '税引前利益', '当期純利益', '税金']
  });

  // 経費詳細（ドリルダウン用）
  const cogsRepair = plData.items.find(i => i.code === 'PL_COGS_REPAIR');
  const cogsDepreciation = plData.items.find(i => i.code === 'PL_COGS_DEPRECIATION');
  const cogsFacility = plData.items.find(i => i.code === 'PL_COGS_FACILITY');
  const cogsTax = plData.items.find(i => i.code === 'PL_COGS_TAX');
  const cogsOther = plData.items.find(i => i.code === 'PL_COGS_OTHER');

  docs.push({
    id: 'pl_expense_detail',
    category: '損益計算書',
    title: '経費詳細（ドリルダウン）',
    content: `菜の花運輸の売上原価に含まれる経費の詳細内訳です。

【2025年3月期の経費詳細】
- 経費合計: ${formatNum(cogsExpense?.values[9], '百万円')}
  - 燃油油脂費: ${formatNum(cogsFuel?.values[9], '百万円')}
  - 修繕費: ${formatNum(cogsRepair?.values[9], '百万円')}
  - 減価償却費: ${formatNum(cogsDepreciation?.values[9], '百万円')}
  - 施設使用料: ${formatNum(cogsFacility?.values[9], '百万円')}
  - 租税公課: ${formatNum(cogsTax?.values[9], '百万円')}
  - 傭車費: ${formatNum(cogsOutsource?.values[9], '百万円')}
  - 取扱手数料: ${formatNum(cogsCommission?.values[9], '百万円')}
  - その他: ${formatNum(cogsOther?.values[9], '百万円')}

【主要経費項目の10年推移】
傭車費: ${years.map((y, i) => `${y}:${formatNum(cogsOutsource?.values[i])}`).join(', ')}
取扱手数料: ${years.map((y, i) => `${y}:${formatNum(cogsCommission?.values[i])}`).join(', ')}
燃油費: ${years.map((y, i) => `${y}:${formatNum(cogsFuel?.values[i])}`).join(', ')}`,
    keywords: ['経費', '修繕費', '減価償却費', '施設使用料', '租税公課', '傭車費', '取扱手数料', 'ドリルダウン', '内訳']
  });

  return docs;
}

// BSドキュメント生成
function generateBSDocuments(): RAGDocument[] {
  const docs: RAGDocument[] = [];
  const years = bsData.years;
  const latestIdx = years.length - 1;

  const assetTotal = bsData.items.find(i => i.code === 'BS_ASSET_TOTAL');
  const liabTotal = bsData.items.find(i => i.code === 'BS_LIAB_TOTAL');
  const equityTotal = bsData.items.find(i => i.code === 'BS_EQUITY_TOTAL');
  const caTotal = bsData.items.find(i => i.code === 'BS_CA_TOTAL');
  const faTotal = bsData.items.find(i => i.code === 'BS_FA_TOTAL');
  const cash = bsData.items.find(i => i.code === 'BS_CA_CASH');
  const land = bsData.items.find(i => i.code === 'BS_FA_LAND');
  const retained = bsData.items.find(i => i.code === 'BS_EQ_RETAINED');
  const shareholder = bsData.items.find(i => i.code === 'BS_EQ_SHAREHOLDER');

  docs.push({
    id: 'bs_summary',
    category: '貸借対照表',
    title: '貸借対照表サマリー',
    content: `菜の花運輸の貸借対照表（BS）の概要です。

【2025年3月期の財政状態】
■資産の部: ${formatNum(assetTotal?.values[latestIdx], '百万円')}
- 流動資産: ${formatNum(caTotal?.values[latestIdx], '百万円')}
  - 現金及び預金: ${formatNum(cash?.values[latestIdx], '百万円')}
- 固定資産: ${formatNum(faTotal?.values[latestIdx], '百万円')}
  - 土地: ${formatNum(land?.values[latestIdx], '百万円')}（資産の約44%）

■負債の部: ${formatNum(liabTotal?.values[latestIdx], '百万円')}

■純資産の部: ${formatNum(equityTotal?.values[latestIdx], '百万円')}
- 株主資本: ${formatNum(shareholder?.values[latestIdx], '百万円')}
- 利益剰余金: ${formatNum(retained?.values[latestIdx], '百万円')}

【10年間の総資産推移】
${years.map((y, i) => `${y}: ${formatNum(assetTotal?.values[i], '百万円')}`).join('\n')}

【特徴】
- 土地保有額が大きく、資産の約44%を占める（約2,633億円）
- 自己資本比率は約57%と財務基盤は安定
- 固定資産中心の資産構成`,
    keywords: ['資産', '負債', '純資産', '貸借対照表', 'BS', '自己資本', '流動資産', '固定資産', '土地', '現金']
  });

  // 流動資産の詳細
  const ar = bsData.items.find(i => i.code === 'BS_CA_AR');
  const caOther = bsData.items.find(i => i.code === 'BS_CA_OTHER');

  docs.push({
    id: 'bs_current_assets',
    category: '貸借対照表',
    title: '流動資産の内訳',
    content: `菜の花運輸の流動資産の詳細です。

【2025年3月期の流動資産内訳】
- 流動資産合計: ${formatNum(caTotal?.values[latestIdx], '百万円')}
- 現金及び預金: ${formatNum(cash?.values[latestIdx], '百万円')}
- 受取手形及び売掛金: ${formatNum(ar?.values[latestIdx], '百万円')}
- その他: ${formatNum(caOther?.values[latestIdx], '百万円')}

【10年間の現金残高推移】
${years.map((y, i) => `${y}: ${formatNum(cash?.values[i], '百万円')}`).join('\n')}

【傾向】
- 現金残高は2021〜2023年に増加後、2024年以降は減少
- 売掛金は概ね横ばいで推移`,
    keywords: ['流動資産', '現金', '預金', '売掛金', '受取手形', '運転資金']
  });

  // 固定資産の詳細
  const building = bsData.items.find(i => i.code === 'BS_FA_BUILDING_NET');
  const machine = bsData.items.find(i => i.code === 'BS_FA_MACHINE_NET');
  const equipment = bsData.items.find(i => i.code === 'BS_FA_EQUIPMENT_NET');
  const construction = bsData.items.find(i => i.code === 'BS_FA_CONSTRUCTION');
  const tangible = bsData.items.find(i => i.code === 'BS_FA_TANGIBLE');
  const intangible = bsData.items.find(i => i.code === 'BS_FA_INTANGIBLE');
  const securities = bsData.items.find(i => i.code === 'BS_FA_SECURITIES');

  docs.push({
    id: 'bs_fixed_assets',
    category: '貸借対照表',
    title: '固定資産の内訳',
    content: `菜の花運輸の固定資産の詳細です。

【2025年3月期の固定資産内訳】
■有形固定資産: ${formatNum(tangible?.values[latestIdx], '百万円')}
- 建物及び構築物: ${formatNum(building?.values[latestIdx], '百万円')}
- 機械装置及び運搬具: ${formatNum(machine?.values[latestIdx], '百万円')}
- 工具器具及び備品: ${formatNum(equipment?.values[latestIdx], '百万円')}
- 土地: ${formatNum(land?.values[latestIdx], '百万円')}
- 建設仮勘定: ${formatNum(construction?.values[latestIdx], '百万円')}

■無形固定資産: ${formatNum(intangible?.values[latestIdx], '百万円')}

■投資その他の資産
- 投資有価証券: ${formatNum(securities?.values[latestIdx], '百万円')}

【固定資産合計】${formatNum(faTotal?.values[latestIdx], '百万円')}

【傾向】
- 土地が固定資産の約52%を占める主要資産
- 機械装置（車両含む）は2025年に32,644百万円に増加（車両更新投資）`,
    keywords: ['固定資産', '有形固定資産', '建物', '機械', '運搬具', '土地', '投資有価証券', '設備投資']
  });

  // 負債の詳細
  const ap = bsData.items.find(i => i.code === 'BS_CL_AP');
  const shortLoan = bsData.items.find(i => i.code === 'BS_CL_SHORT_LOAN');
  const currentLTD = bsData.items.find(i => i.code === 'BS_CL_CURRENT_LTD');
  const clTotal = bsData.items.find(i => i.code === 'BS_CL_TOTAL');
  const longLoan = bsData.items.find(i => i.code === 'BS_LL_LONG_LOAN');
  const pension = bsData.items.find(i => i.code === 'BS_LL_PENSION');
  const llTotal = bsData.items.find(i => i.code === 'BS_LL_TOTAL');

  docs.push({
    id: 'bs_liabilities',
    category: '貸借対照表',
    title: '負債の内訳',
    content: `菜の花運輸の負債の詳細です。

【2025年3月期の負債内訳】
■流動負債: ${formatNum(clTotal?.values[latestIdx], '百万円')}
- 支払手形及び買掛金: ${formatNum(ap?.values[latestIdx], '百万円')}
- 短期借入金: ${formatNum(shortLoan?.values[latestIdx], '百万円')}
- 1年以内返済予定長期借入金: ${formatNum(currentLTD?.values[latestIdx], '百万円')}

■固定負債: ${formatNum(llTotal?.values[latestIdx], '百万円')}
- 長期借入金: ${formatNum(longLoan?.values[latestIdx], '百万円')}
- 退職給付に係る負債: ${formatNum(pension?.values[latestIdx], '百万円')}

【負債合計】${formatNum(liabTotal?.values[latestIdx], '百万円')}

【有利子負債推移】
${years.map((y, i) => {
  const totalDebt = (shortLoan?.values[i] || 0) + (currentLTD?.values[i] || 0) + (longLoan?.values[i] || 0);
  return `${y}: ${formatNum(totalDebt, '百万円')}`;
}).join('\n')}`,
    keywords: ['負債', '借入金', '買掛金', '流動負債', '固定負債', '有利子負債', '退職給付']
  });

  // 純資産の詳細
  const capital = bsData.items.find(i => i.code === 'BS_EQ_CAPITAL');
  const capitalSurplus = bsData.items.find(i => i.code === 'BS_EQ_CAPITAL_SURPLUS');
  const treasury = bsData.items.find(i => i.code === 'BS_EQ_TREASURY');
  const ociSecurities = bsData.items.find(i => i.code === 'BS_OCI_SECURITIES');
  const ociLand = bsData.items.find(i => i.code === 'BS_OCI_LAND_REVAL');

  docs.push({
    id: 'bs_equity',
    category: '貸借対照表',
    title: '純資産の内訳',
    content: `菜の花運輸の純資産の詳細です。

【2025年3月期の純資産内訳】
■株主資本: ${formatNum(shareholder?.values[latestIdx], '百万円')}
- 資本金: ${formatNum(capital?.values[latestIdx], '百万円')}
- 資本剰余金: ${formatNum(capitalSurplus?.values[latestIdx], '百万円')}
- 利益剰余金: ${formatNum(retained?.values[latestIdx], '百万円')}
- 自己株式: ${formatNum(treasury?.values[latestIdx], '百万円')}

■その他の包括利益累計額
- その他有価証券評価差額金: ${formatNum(ociSecurities?.values[latestIdx], '百万円')}
- 土地再評価差額金: ${formatNum(ociLand?.values[latestIdx], '百万円')}

【純資産合計】${formatNum(equityTotal?.values[latestIdx], '百万円')}

【利益剰余金推移】
${years.map((y, i) => `${y}: ${formatNum(retained?.values[i], '百万円')}`).join('\n')}

【特記事項】
- 2025年に自己株式が大幅減少（自社株消却実施）
- 土地再評価差額金は約401億円で固定`,
    keywords: ['純資産', '株主資本', '資本金', '利益剰余金', '自己株式', '資本剰余金', '配当']
  });

  return docs;
}

// 財務指標ドキュメント生成
function generateIndicatorDocuments(): RAGDocument[] {
  const docs: RAGDocument[] = [];
  const years = indicatorsData.years;
  const latestIdx = years.length - 1;
  const categories = indicatorsData.categories;

  // 収益性
  const grossMargin = categories['収益性'].find(i => i.code === 'GROSS_MARGIN');
  const opMargin = categories['収益性'].find(i => i.code === 'OP_MARGIN');
  const netMargin = categories['収益性'].find(i => i.code === 'NET_MARGIN');

  docs.push({
    id: 'indicator_profitability',
    category: '財務指標',
    title: '収益性指標',
    content: `菜の花運輸の収益性指標です。

【2025年3月期】
- 売上高総利益率: ${formatNum(grossMargin?.values[latestIdx], '%')}
- 売上高営業利益率: ${formatNum(opMargin?.values[latestIdx], '%')}
- 売上高当期純利益率: ${formatNum(netMargin?.values[latestIdx], '%')}

【推移（営業利益率）】
${years.map((y, i) => `${y}: ${formatNum(opMargin?.values[i], '%')}`).join('\n')}

【分析】
- 営業利益率は2021年3月期の7.41%をピークに低下傾向
- 2025年3月期は2.44%まで低下
- 売上原価率の上昇が収益性悪化の主因`,
    keywords: ['収益性', '利益率', '営業利益率', '総利益率', '純利益率', 'マージン']
  });

  // ROE/ROA
  const roe = categories['資本効率性'].find(i => i.code === 'ROE');
  const roa = categories['資本効率性'].find(i => i.code === 'ROA');
  const roic = categories['資本効率性'].find(i => i.code === 'ROIC');

  docs.push({
    id: 'indicator_efficiency',
    category: '財務指標',
    title: '資本効率性指標（ROE/ROA/ROIC）',
    content: `菜の花運輸の資本効率性指標です。

【2025年3月期】
- ROE（自己資本利益率）: ${formatNum(roe?.values[latestIdx], '%')}
- ROA（総資産利益率）: ${formatNum(roa?.values[latestIdx], '%')}
- ROIC（投下資本利益率）: ${formatNum(roic?.values[latestIdx], '%')}

【ROE推移】
${years.map((y, i) => `${y}: ${formatNum(roe?.values[i], '%')}`).join('\n')}

【分析】
- ROEは2023年3月期の7.92%をピークに低下
- 2024-2025年は3%未満と資本効率が悪化
- 株主の要求リターンに対して低水準`,
    keywords: ['ROE', 'ROA', 'ROIC', '資本効率', '自己資本利益率', '総資産利益率']
  });

  // 安全性
  const equityRatio = categories['安全性'].find(i => i.code === 'EQUITY_RATIO');
  const deRatio = categories['安全性'].find(i => i.code === 'DE_RATIO');
  const currentRatio = categories['安全性'].find(i => i.code === 'CURRENT_RATIO');
  const icr = categories['安全性'].find(i => i.code === 'ICR');

  docs.push({
    id: 'indicator_safety',
    category: '財務指標',
    title: '安全性指標',
    content: `菜の花運輸の財務安全性指標です。

【2025年3月期】
- 自己資本比率: ${formatNum(equityRatio?.values[latestIdx], '%')}
- 負債比率（D/E）: ${formatNum(deRatio?.values[latestIdx], '%')}
- 流動比率: ${formatNum(currentRatio?.values[latestIdx], '%')}
- インタレストカバレッジ: ${formatNum(icr?.values[latestIdx], '倍')}

【分析】
- 自己資本比率は57%程度で安定
- 流動比率82%は100%を下回り、短期的な支払能力に注意
- インタレストカバレッジは15.56倍で利払い能力は十分`,
    keywords: ['安全性', '自己資本比率', '負債比率', '流動比率', 'D/E', '財務健全性']
  });

  // 株式指標
  const eps = categories['株式指標'].find(i => i.code === 'EPS');
  const bps = categories['株式指標'].find(i => i.code === 'BPS');
  const pbr = categories['株式指標'].find(i => i.code === 'PBR');
  const per = categories['株式指標'].find(i => i.code === 'PER');
  const payout = categories['株式指標'].find(i => i.code === 'PAYOUT_RATIO');

  docs.push({
    id: 'indicator_stock',
    category: '財務指標',
    title: '株式指標（EPS/BPS/PBR/PER）',
    content: `菜の花運輸の株式関連指標です。

【2025年3月期】
- EPS（1株当たり利益）: ${formatNum(eps?.values[latestIdx], '円')}
- BPS（1株当たり純資産）: ${formatNum(bps?.values[latestIdx], '円')}
- PBR（株価純資産倍率）: ${formatNum(pbr?.values[latestIdx], '倍')}
- PER（株価収益率）: ${formatNum(per?.values[latestIdx], '倍')}
- 配当性向: ${formatNum(payout?.values[latestIdx], '%')}

【分析】
- PBRは0.55倍と1倍を大きく下回り、株式市場での評価が低い
- BPSは7,674円と純資産は厚いが、株価に反映されていない
- 配当性向は約35%で安定配当を維持`,
    keywords: ['EPS', 'BPS', 'PBR', 'PER', '株価', '配当', '株式', '1株当たり']
  });

  return docs;
}

// セグメント情報ドキュメント
function generateSegmentDocuments(): RAGDocument[] {
  const docs: RAGDocument[] = [];
  const segments = segmentData.segments;

  const domesticRev = segmentData.items.find(i => i.code === 'seg_revenue_domestic');
  const logisticsRev = segmentData.items.find(i => i.code === 'seg_revenue_logistics');
  const intlRev = segmentData.items.find(i => i.code === 'seg_revenue_international');
  const otherRev = segmentData.items.find(i => i.code === 'seg_revenue_other');

  const domesticOp = segmentData.items.find(i => i.code === 'seg_op_domestic');
  const logisticsOp = segmentData.items.find(i => i.code === 'seg_op_logistics');

  docs.push({
    id: 'segment_summary',
    category: 'セグメント',
    title: 'セグメント別業績',
    content: `菜の花運輸のセグメント別業績です。

【2025年3月期 セグメント別売上高】
- 国内運送（トラック）: ${formatNum(domesticRev?.values['2025年3月期_国内運送（トラック）'], '百万円')}（約84%）
- ロジスティクス・3PL: ${formatNum(logisticsRev?.values['2025年3月期_ロジスティクス・3PL'], '百万円')}（約7%）
- 国際運送: ${formatNum(intlRev?.values['2025年3月期_国際運送'], '百万円')}（約4%）
- その他: ${formatNum(otherRev?.values['2025年3月期_その他'], '百万円')}（約5%）

【2025年3月期 セグメント別営業利益】
- 国内運送: ${formatNum(domesticOp?.values['2025年3月期_国内運送（トラック）'], '百万円')}（利益率1.7%）
- ロジスティクス・3PL: ${formatNum(logisticsOp?.values['2025年3月期_ロジスティクス・3PL'], '百万円')}（利益率9.2%）

【分析】
- 国内運送が売上の約84%を占める主力事業
- ロジスティクス・3PLは利益率が高く成長領域
- 国内運送の利益率低下が全社業績に影響`,
    keywords: ['セグメント', '事業', '国内運送', 'トラック', 'ロジスティクス', '3PL', '国際', '部門']
  });

  return docs;
}

// 株主情報ドキュメント
function generateShareholderDocuments(): RAGDocument[] {
  const docs: RAGDocument[] = [];

  const items = shareholdersData.items;
  const topHolders = items.slice(0, 5);

  docs.push({
    id: 'shareholder_summary',
    category: '株主',
    title: '株主構成',
    content: `菜の花運輸の株主構成（2025年8月7日時点）です。

【発行済株式総数】${formatNum(shareholdersData.totalShares)}株
【株価】${formatNum(shareholdersData.stockPrice, '円')}

【主要株主（上位5社）】
${topHolders.map((h, i) => `${i + 1}. ${h.name}: ${h.ratio}%（${formatNum(h.shares)}株）- ${h.category}`).join('\n')}

【株主構成の特徴】
- 信託・機関投資家が上位を占める
- 創業家（菜の花公益財団）は5.6%を保有
- アクティビスト（オレンジ・パートナー）が6.8%を保有しROE改善を求める動きあり
- 外資系ファンド（CCBJインベストメンツ）も5.6%を保有
- 従業員持株会は4.0%

【注目ポイント】
- アクティビストが資本効率改善を要求
- PBR1倍割れを問題視する株主からの圧力あり`,
    keywords: ['株主', '持株', '機関投資家', 'アクティビスト', '創業家', '株式', '保有']
  });

  return docs;
}

// 車両・拠点情報
function generateOperationsDocuments(): RAGDocument[] {
  const docs: RAGDocument[] = [];

  docs.push({
    id: 'vehicles_summary',
    category: '事業基盤',
    title: '車両保有状況',
    content: `菜の花運輸の車両保有状況（2025年3月期）です。

【車両台数】合計 ${formatNum(vehiclesData.total)}台
- 大型自動車: ${formatNum(vehiclesData.items[0].values['大型自動車'])}台（${vehiclesData.items[1].values['大型自動車']}%）
- 中型自動車: ${formatNum(vehiclesData.items[0].values['中型自動車'])}台（${vehiclesData.items[1].values['中型自動車']}%）
- 小型自動車: ${formatNum(vehiclesData.items[0].values['小型自動車'])}台（${vehiclesData.items[1].values['小型自動車']}%）

【積載率】${vehiclesData.loadingRate}%

【分析】
- 小型車両が最も多く、ラストワンマイル配送に対応
- 積載率51.5%は業界平均程度
- 車両の老朽化と更新投資が課題`,
    keywords: ['車両', 'トラック', '台数', '積載率', '大型', '中型', '小型']
  });

  // 拠点情報
  const summary = locationsData.summary;
  const totalLocations = summary.domestic.total + summary.overseas.total;

  docs.push({
    id: 'locations_summary',
    category: '事業基盤',
    title: '拠点ネットワーク',
    content: `菜の花運輸の拠点ネットワーク（${locationsData.asOf}時点）です。

【拠点数】合計 ${formatNum(totalLocations)}拠点
■国内: ${formatNum(summary.domestic.total)}拠点
- 支店: ${formatNum(summary.domestic.branches)}拠点
- 営業所: ${formatNum(summary.domestic.offices)}拠点
- 物流センター: ${formatNum(summary.domestic.centers)}拠点

■海外: ${formatNum(summary.overseas.total)}拠点
- タイ、マレーシア、カンボジアに展開

【地域別拠点数】
- 関東: 94拠点（最大）
- 関西: 93拠点
- 中国・四国: 46拠点
- 東海: 45拠点
- 九州: 41拠点

【分析】
- 全国に約400拠点を展開
- 物流センターは44拠点でロジスティクス機能を提供
- 海外にも7拠点展開し、アジア物流に対応
- きめ細かな配送ネットワークが強み`,
    keywords: ['拠点', '営業所', '物流センター', 'ネットワーク', '配送', '支店', '海外']
  });

  return docs;
}

// 会社概要ドキュメント
function generateCompanyDocuments(): RAGDocument[] {
  return [{
    id: 'company_overview',
    category: '会社概要',
    title: '菜の花運輸 会社概要',
    content: `菜の花運輸株式会社の概要です。

【基本情報】
- 会社名: 菜の花運輸株式会社
- 業種: 運送業（トラック運送を主力とする総合物流企業）
- 決算期: 3月期

【事業内容】
1. 国内運送（トラック）- 主力事業、売上の約84%
2. ロジスティクス・3PL - 倉庫・在庫管理サービス
3. 国際運送 - 輸出入貨物取扱
4. その他 - 不動産賃貸等

【経営上の特徴】
- 全国365拠点のネットワーク
- 車両約2万台を保有
- 土地保有額が大きい（約2,633億円）
- 自己資本比率57%で財務基盤安定

【課題】
- 2024年問題への対応
- PBR1倍割れ
- 営業利益率の低下`,
    keywords: ['会社', '概要', '菜の花運輸', '運送', '物流', '事業', 'トラック']
  }];
}

// 全ドキュメントを生成
export function generateAllDocuments(): RAGDocument[] {
  return [
    ...generateCompanyDocuments(),
    ...generatePLDocuments(),
    ...generateBSDocuments(),
    ...generateIndicatorDocuments(),
    ...generateSegmentDocuments(),
    ...generateShareholderDocuments(),
    ...generateOperationsDocuments(),
  ];
}

// 拡張キーワードマッピング（類義語・関連語）
const keywordExpansion: Record<string, string[]> = {
  '業績': ['売上', '利益', '収益', 'PL', '損益'],
  '財務': ['BS', '貸借', '資産', '負債', '純資産'],
  '指標': ['ROE', 'ROA', 'PBR', 'PER', '利益率', '比率'],
  '収益性': ['利益率', 'マージン', '営業利益', '純利益'],
  '効率': ['ROE', 'ROA', 'ROIC', '回転率'],
  '安全': ['自己資本比率', '負債比率', '流動比率'],
  '株': ['株主', '株価', 'PBR', 'PER', 'EPS', 'BPS', '配当'],
  '車両': ['トラック', '台数', '積載'],
  '拠点': ['営業所', '物流センター', '支店'],
  'コスト': ['費用', '経費', '人件費', '燃油', '傭車'],
  '2024': ['2024年', '2025年3月期'],
  '2025': ['2025年', '2025年3月期'],
  '最新': ['2025年', '2025年3月期'],
  '今期': ['2025年', '2025年3月期'],
};

// キーワードベースの関連ドキュメント検索
export function searchDocuments(query: string, maxResults: number = 5): RAGDocument[] {
  const docs = generateAllDocuments();
  const queryLower = query.toLowerCase();
  const queryTokens = query.split(/[\s、。？！]+/).filter(t => t.length > 0);

  // クエリを拡張（配列として管理）
  const expandedTokensSet: string[] = [...queryTokens];
  for (const token of queryTokens) {
    Object.entries(keywordExpansion).forEach(([key, expansions]) => {
      if (token.includes(key) || key.includes(token)) {
        expansions.forEach(e => {
          if (!expandedTokensSet.includes(e)) {
            expandedTokensSet.push(e);
          }
        });
      }
    });
  }
  const expandedTokens = expandedTokensSet;

  // スコア計算
  const scored = docs.map(doc => {
    let score = 0;
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    // ドキュメントキーワードとクエリのマッチ
    for (const keyword of doc.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (queryLower.includes(keywordLower)) {
        score += 15;
      }
      // 拡張トークンとのマッチ
      for (const token of expandedTokens) {
        if (keywordLower.includes(token.toLowerCase()) || token.toLowerCase().includes(keywordLower)) {
          score += 5;
        }
      }
    }

    // タイトルマッチ
    for (const token of expandedTokens) {
      if (titleLower.includes(token.toLowerCase())) {
        score += 8;
      }
    }

    // 内容マッチ
    for (const token of expandedTokens) {
      if (contentLower.includes(token.toLowerCase())) {
        score += 3;
      }
    }

    // カテゴリマッチ
    for (const token of queryTokens) {
      if (doc.category.includes(token)) {
        score += 10;
      }
    }

    return { doc, score };
  });

  // スコア順にソートして上位を返す
  const results = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.doc);

  // マッチがない場合は基本ドキュメント（会社概要、PLサマリー）を返す
  if (results.length === 0) {
    return docs.filter(d =>
      d.id === 'company_overview' ||
      d.id === 'pl_summary' ||
      d.id === 'indicator_profitability'
    ).slice(0, maxResults);
  }

  return results;
}

// コンテキスト生成
export function generateContext(query: string): string {
  const relevantDocs = searchDocuments(query, 3);

  if (relevantDocs.length === 0) {
    return '';
  }

  const contextParts = relevantDocs.map(doc =>
    `【${doc.category}】${doc.title}\n${doc.content}`
  );

  return `以下は菜の花運輸の財務データから検索された関連情報です：

${contextParts.join('\n\n---\n\n')}`;
}
