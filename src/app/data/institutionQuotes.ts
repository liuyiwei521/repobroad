import type { InstQuote, SourceId } from './types';
import { institutions } from './institutions';

/**
 * 根据 source + period 生成所有机构在该组合下的报价。
 * 基础价取自对应 source 表，然后按机构类型做一点价差偏移。
 */
function generate(source: SourceId, period: string, baseBid: number, baseAsk: number): InstQuote[] {
  return institutions.map((inst) => {
    // 大行/股份行通常更优（更低逆回购 / 更高正回购）；非银略差
    const penalty =
      inst.type === '大行'   ? 0 :
      inst.type === '股份行' ? 0.005 :
      inst.type === '城商行' ? 0.01 :
      inst.type === '券商'   ? 0.015 :
      inst.type === '基金'   ? 0.02 :
      inst.type === '理财子' ? 0.015 :
                               0.018;
    const noise = (Math.random() - 0.5) * 0.005;
    return {
      institutionId: inst.id,
      institutionName: inst.name,
      institutionType: inst.type,
      source,
      period,
      bidRate: +(baseBid + penalty + noise).toFixed(4),
      bidVolume: +(50 + Math.random() * 200).toFixed(0),
      askRate: +(baseAsk + penalty + noise).toFixed(4),
      askVolume: +(50 + Math.random() * 200).toFixed(0),
    };
  });
}

/**
 * 为给定 source + period 返回机构级报价。
 * 这里先用简单的 base 值；后续可从 quotes 表派生。
 */
export function getInstitutionQuotes(source: SourceId, period: string): InstQuote[] {
  // 简化：默认基础 bid=1.95, ask=2.00
  return generate(source, period, 1.95, 2.00);
}
