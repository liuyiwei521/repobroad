export interface BankPriceRow {
  institution: string; // 机构名
  bankRate: number;    // 银行利率（%）
  nonbankRate: number; // 非银利率（%）
  updateTime: string;  // 更新时间
}

export const bankPriceRows: BankPriceRow[] = [
  { institution: '工商银行', bankRate: 1.95, nonbankRate: 2.00, updateTime: '10:32:15' },
  { institution: '农业银行', bankRate: 1.93, nonbankRate: 1.98, updateTime: '10:28:41' },
  { institution: '建设银行', bankRate: 1.95, nonbankRate: 2.00, updateTime: '10:35:02' },
  { institution: '中国银行', bankRate: 1.90, nonbankRate: 1.97, updateTime: '10:21:33' },
  { institution: '交通银行', bankRate: 1.92, nonbankRate: 1.99, updateTime: '10:40:18' },
  { institution: '招商银行', bankRate: 1.94, nonbankRate: 2.01, updateTime: '10:38:55' },
  { institution: '浦发银行', bankRate: 1.91, nonbankRate: 1.96, updateTime: '10:15:20' },
];
