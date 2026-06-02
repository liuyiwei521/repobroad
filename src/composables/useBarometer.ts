import { computed, ref } from 'vue';
import {
  BAROMETER_DATA,
  type BarometerMetric,
  type BarometerTab,
  type BarometerTimeframe,
} from '../data/barometerMock';

export function useBarometer() {
  const tab = ref<BarometerTab>('realtime');
  const timeframe = ref<BarometerTimeframe>('overnight');
  const metric = ref<BarometerMetric>('count');

  const currentSlice = computed(() => BAROMETER_DATA[timeframe.value][metric.value]);

  return { tab, timeframe, metric, currentSlice };
}
