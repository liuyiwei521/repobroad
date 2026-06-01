import { computed, ref } from 'vue';
import type { Tenor } from '../data/mockData';
import {
  generateYesterdaySeries,
  getAvailableDimensions,
  getOverviewSlice,
  personalVsOrgData,
  type ChartSeries,
  type DirectionFilter,
  type OverviewDimension,
  type OverviewMetric,
  type OverviewSlice,
} from '../data/quoteOverviewMock';

export type OverviewTab = 'trend' | 'compare';

export const useQuoteOverview = () => {
  const activeTab = ref<OverviewTab>('trend');
  const metric = ref<OverviewMetric>('heat');
  const dimension = ref<OverviewDimension>('tenor');
  const direction = ref<DirectionFilter>('all');
  const showYesterday = ref(false);

  const enabledTenors = ref<Set<Tenor>>(new Set(['R001', 'R007']));

  const availableDimensions = computed(() => getAvailableDimensions(metric.value));

  const rawSlice = computed<OverviewSlice | undefined>(() =>
    getOverviewSlice(metric.value, dimension.value)
  );

  const currentSlice = computed<OverviewSlice | undefined>(() => {
    const slice = rawSlice.value;
    if (!slice) return undefined;
    if (!showYesterday.value) return slice;
    return {
      ...slice,
      series: [...slice.series, ...generateYesterdaySeries(slice.series)],
    };
  });

  const setMetric = (m: OverviewMetric) => {
    metric.value = m;
    const dims = getAvailableDimensions(m);
    if (!dims.includes(dimension.value)) {
      dimension.value = dims.includes('tenor') ? 'tenor' : dims[0] ?? 'all';
    }
  };

  const setDimension = (d: OverviewDimension) => {
    dimension.value = d;
  };

  const toggleTenor = (tenor: Tenor) => {
    const next = new Set(enabledTenors.value);
    if (next.has(tenor)) {
      if (next.size > 1) next.delete(tenor);
    } else {
      next.add(tenor);
    }
    enabledTenors.value = next;
  };

  const compareSeries = computed<ChartSeries[]>(() => {
    const result: ChartSeries[] = [];
    for (const s of personalVsOrgData.series) {
      if (!enabledTenors.value.has(s.tenor)) continue;
      result.push({
        key: `personal-${s.tenor}`,
        label: `个人 ${s.tenor}`,
        color: s.color,
        lineStyle: 'solid',
        points: s.points
          .filter(p => p.personalRate != null)
          .map(p => ({ t: p.t, value: p.personalRate! })),
      });
      result.push({
        key: `org-${s.tenor}`,
        label: `机构 ${s.tenor}`,
        color: s.color,
        lineStyle: 'dashed',
        points: s.points
          .filter(p => p.orgRate != null)
          .map(p => ({ t: p.t, value: p.orgRate! })),
      });
    }
    return result;
  });

  const compareInsight = computed(() => personalVsOrgData.insight);

  return {
    activeTab,
    metric,
    dimension,
    direction,
    showYesterday,
    enabledTenors,
    availableDimensions,
    currentSlice,
    compareSeries,
    compareInsight,
    setMetric,
    setDimension,
    toggleTenor,
  };
};
