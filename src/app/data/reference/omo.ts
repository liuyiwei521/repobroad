/** 公开市场操作 — 逐笔明细 */
export interface OmoRecord {
  date: string;
  type: "逆回购" | "逆回购到期" | "MLF" | "MLF到期" | "国库定存" | "TMLF";
  period: string;
  rate: number;
  amount: number; // 亿
}

/** 公开市场操作 — 净投放统计（日聚合） */
export interface OmoSummary {
  date: string;
  netInject: number; // 净投放，正=放水，负=回笼
  repo: number;
  repoMaturity: number;
  mlf: number | null;
  mlfMaturity: number | null;
}

export const omoRecords: OmoRecord[] = [
  { date: "2026-04-21", type: "逆回购到期", period: "7D",  rate: 1.40, amount: -10 },
  { date: "2026-04-21", type: "逆回购",     period: "7D",  rate: 1.40, amount:  50 },
  { date: "2026-04-20", type: "逆回购到期", period: "7D",  rate: 1.40, amount:  -5 },
  { date: "2026-04-20", type: "逆回购",     period: "7D",  rate: 1.40, amount:   5 },
  { date: "2026-04-17", type: "逆回购到期", period: "7D",  rate: 1.40, amount: -20 },
  { date: "2026-04-17", type: "逆回购",     period: "7D",  rate: 1.40, amount:   5 },
  { date: "2026-04-17", type: "国库定存",   period: "91D", rate: 1.70, amount: 2000 },
  { date: "2026-04-16", type: "逆回购到期", period: "7D",  rate: 1.40, amount:  -5 },
  { date: "2026-04-16", type: "逆回购",     period: "7D",  rate: 1.40, amount:   5 },
  { date: "2026-04-15", type: "逆回购到期", period: "7D",  rate: 1.40, amount:  -5 },
  { date: "2026-04-15", type: "逆回购",     period: "7D",  rate: 1.40, amount:   5 },
  { date: "2026-04-14", type: "逆回购到期", period: "7D",  rate: 1.40, amount:  -5 },
  { date: "2026-04-14", type: "逆回购",     period: "7D",  rate: 1.40, amount:  10 },
  { date: "2026-04-11", type: "逆回购到期", period: "7D",  rate: 1.40, amount:  -5 },
  { date: "2026-04-11", type: "逆回购",     period: "7D",  rate: 1.40, amount:  20 },
  { date: "2026-04-10", type: "MLF到期",    period: "1Y",  rate: 2.00, amount: -1000 },
  { date: "2026-04-10", type: "MLF",        period: "1Y",  rate: 2.00, amount:  800 },
];

export const omoSummary: OmoSummary[] = [
  { date: "2026-04-21", netInject:  +40,  repo:  +50, repoMaturity: -10, mlf: null, mlfMaturity: null },
  { date: "2026-04-20", netInject:    0,  repo:   +5, repoMaturity:  -5, mlf: null, mlfMaturity: null },
  { date: "2026-04-17", netInject: +1985, repo:   +5, repoMaturity: -20, mlf: null, mlfMaturity: null },
  { date: "2026-04-16", netInject:    0,  repo:   +5, repoMaturity:  -5, mlf: null, mlfMaturity: null },
  { date: "2026-04-15", netInject: -1000, repo:   +5, repoMaturity:  -5, mlf: null, mlfMaturity: null },
  { date: "2026-04-14", netInject:   +5,  repo:  +10, repoMaturity:  -5, mlf: null, mlfMaturity: null },
  { date: "2026-04-11", netInject:  +15,  repo:  +20, repoMaturity:  -5, mlf: null, mlfMaturity: null },
  { date: "2026-04-10", netInject: -200,  repo:    0, repoMaturity:   0, mlf: +800, mlfMaturity: -1000 },
];
