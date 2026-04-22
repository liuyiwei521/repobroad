import type { Institution } from './types';

export const institutions: Institution[] = [
  // 大行
  { id: 'icbc', name: '工商银行', type: '大行' },
  { id: 'abc', name: '农业银行', type: '大行' },
  { id: 'boc', name: '中国银行', type: '大行' },
  { id: 'ccb', name: '建设银行', type: '大行' },
  { id: 'bocom', name: '交通银行', type: '大行' },

  // 股份行
  { id: 'cmb', name: '招商银行', type: '股份行' },
  { id: 'spdb', name: '浦发银行', type: '股份行' },
  { id: 'cib', name: '兴业银行', type: '股份行' },

  // 城商行
  { id: 'bob', name: '北京银行', type: '城商行' },
  { id: 'bsh', name: '上海银行', type: '城商行' },

  // 券商
  { id: 'citics', name: '中信证券', type: '券商' },
  { id: 'zts', name: '中泰证券', type: '券商' },
  { id: 'gtja', name: '国泰君安', type: '券商' },
  { id: 'htsc', name: '华泰证券', type: '券商' },

  // 基金
  { id: 'py', name: '鹏扬基金', type: '基金' },
  { id: 'hx', name: '华夏基金', type: '基金' },
  { id: 'jsh', name: '嘉实基金', type: '基金' },
  { id: 'zo', name: '中欧基金', type: '基金' },

  // 理财子
  { id: 'bybank', name: '北银理财', type: '理财子' },
  { id: 'gsbank', name: '工银理财', type: '理财子' },

  // 保险
  { id: 'pingan', name: '平安资管', type: '保险' },
  { id: 'cpic', name: '太保资管', type: '保险' },
];

export const institutionMap: Record<string, Institution> = Object.fromEntries(
  institutions.map((i) => [i.id, i])
);
