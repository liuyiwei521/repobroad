import { useState, type ReactNode } from "react";
import type { CfetsInstPeriod, CfetsMetricKey } from "../../types";
import {
  cfetsDefaultInstitutionIndexes,
  cfetsDenseMetricOptions,
  cfetsInstPeriodLabels,
  cfetsInstitutionOptions,
} from "./institutionPeriod.data";
import { CfetsDenseChart } from "./CfetsDenseChart";
import {
  buildCfetsDenseSeries,
  cfetsDefaultChartKindForMetricMode,
  cfetsMetricDisplayLabel,
  cfetsModeFromMetricKey,
  formatCfetsDenseValue,
  toggleArrayValue,
} from "./institutionPeriod.utils";
import type {
  CfetsChartKind,
  CfetsDenseDetail,
  CfetsDimension,
  CfetsInstMetricMode,
  CfetsRepoDirection,
} from "./institutionPeriod.types";

function CfetsInstPanel({
  initialPeriod = "R001",
  initialMetric = "buyAmt",
}: {
  initialPeriod?: CfetsInstPeriod;
  initialMetric?: CfetsMetricKey;
}) {
  const [metricMode, setMetricMode] = useState<CfetsInstMetricMode>(() =>
    cfetsModeFromMetricKey(initialMetric),
  );
  const [direction, setDirection] = useState<CfetsRepoDirection>(
    initialMetric === "sellRate" || initialMetric === "sellAmt" || initialMetric === "sellBalance"
      ? "reverse"
      : "repo",
  );
  const [chartKind, setChartKind] = useState<CfetsChartKind>(() =>
    cfetsDefaultChartKindForMetricMode(cfetsModeFromMetricKey(initialMetric)),
  );
  const [dimension, setDimension] = useState<CfetsDimension>("institution");
  const [selectedPeriods, setSelectedPeriods] = useState<CfetsInstPeriod[]>(
    () => [initialPeriod],
  );
  const [selectedInstitutions, setSelectedInstitutions] = useState<number[]>(
    () => [...cfetsDefaultInstitutionIndexes],
  );
  const [selectedSupplyTags, setSelectedSupplyTags] = useState<string[]>([
    "利率债",
    "同业存单",
    "信用债",
    "有效供给",
  ]);
  const [expandedRule, setExpandedRule] = useState<string | null>("回购比例(~2025)");
  const [activeDetail, setActiveDetail] = useState<CfetsDenseDetail | null>(
    null,
  );

  const selectedPeriod = selectedPeriods.includes(initialPeriod)
    ? initialPeriod
    : (selectedPeriods[0] ?? initialPeriod);
  const metricLabel = cfetsMetricDisplayLabel(metricMode);
  const chartTitle = `${direction === "repo" ? "正回购" : "逆回购"}-${metricLabel}（${
    chartKind === "bar" ? "柱状图" : "折线图"
  }）`;
  const chartData = buildCfetsDenseSeries({
    metricMode,
    direction,
    dimension,
    selectedPeriods,
    selectedInstitutions,
  });

  function toggleInstitution(index: number) {
    setSelectedInstitutions((current) => toggleArrayValue(current, index));
  }

  function toggleSupplyTag(tag: string) {
    setSelectedSupplyTags((current) => toggleArrayValue(current, tag));
  }

  function setAllPeriods(checked: boolean) {
    setSelectedPeriods(checked ? [...cfetsInstPeriodLabels] : []);
  }

  function setAllInstitutions(checked: boolean) {
    setSelectedInstitutions(
      checked ? cfetsInstitutionOptions.map((_, index) => index) : [],
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--tk-color-surface-page)] text-slate-200">
      <div className="shrink-0 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)]">
        <DenseOptionRow>
          {cfetsDenseMetricOptions.map((option) => (
            <DenseRadio
              key={option.key}
              checked={metricMode === option.key}
              label={option.label}
              name="cfets-metric-mode"
              onChange={() => {
                setMetricMode(option.key);
                setChartKind(cfetsDefaultChartKindForMetricMode(option.key));
              }}
            />
          ))}
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseCheckbox
            checked={selectedInstitutions.length === cfetsInstitutionOptions.length}
            label="全部机构"
            onChange={setAllInstitutions}
          />
          {cfetsInstitutionOptions.map((option, index) => (
            <DenseCheckbox
              key={option.label}
              checked={selectedInstitutions.includes(index)}
              label={option.label}
              onChange={() => toggleInstitution(index)}
            />
          ))}
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseCheckbox
            checked={selectedPeriods.length === cfetsInstPeriodLabels.length}
            label="全部期限"
            onChange={setAllPeriods}
          />
          {cfetsInstPeriodLabels.map((period) => (
            <DenseCheckbox
              key={period}
              checked={selectedPeriods.includes(period)}
              label={period}
              onChange={() =>
                setSelectedPeriods((current) => toggleArrayValue(current, period))
              }
            />
          ))}
        </DenseOptionRow>
        <div className="grid border-t border-[color:var(--tk-color-border-divider-dark)] text-xs">
          {["回购比例(~2025)", "回购比例(2026~)", "质押券比例(~2025)", "质押券比例(2026~)"].map(
            (rule, index) => (
              <button
                key={rule}
                type="button"
                className={`grid grid-cols-[12rem_1fr_auto] items-center gap-3 border-b border-[color:var(--tk-color-border-divider-dark)] px-4 py-2 text-left last:border-b-0 ${
                  expandedRule === rule
                    ? "bg-[rgba(56,113,189,0.12)] text-slate-100"
                    : "text-slate-400 hover:bg-[rgba(56,113,189,0.08)]"
                }`}
                onClick={() => setExpandedRule(expandedRule === rule ? null : rule)}
              >
                <span>{rule}</span>
                <span className="truncate text-mini text-slate-500">
                  {expandedRule === rule
                    ? `${selectedPeriod} · ${metricLabel} · 机构/期限明细已展开`
                    : "点击展开该口径明细"}
                </span>
                <span className="flex items-center gap-2">
                  {index < 2 ? (
                    <>
                      {["利率债", "同业存单", "信用债"].map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-mini"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSupplyTag(tag);
                          }}
                        >
                          <input
                            checked={selectedSupplyTags.includes(tag)}
                            className="h-3 w-3 accent-[var(--tk-color-brand-primary)]"
                            readOnly
                            type="checkbox"
                          />
                          {tag}
                        </span>
                      ))}
                      <span className="rounded bg-[var(--tk-color-brand-primary)] px-2 py-1 text-mini font-semibold text-white">
                        有效供给
                      </span>
                    </>
                  ) : (
                    <span className="rounded bg-[var(--tk-color-brand-primary)] px-2 py-1 text-mini font-semibold text-white">
                      三四类
                    </span>
                  )}
                </span>
              </button>
            ),
          )}
        </div>
        <DenseOptionRow>
          <DenseRadio
            checked={direction === "repo"}
            label="正回购"
            name="cfets-direction"
            onChange={() => setDirection("repo")}
          />
          <DenseRadio
            checked={direction === "reverse"}
            label="逆回购"
            name="cfets-direction"
            onChange={() => setDirection("reverse")}
          />
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseRadio
            checked={chartKind === "line"}
            label="折线图"
            name="cfets-chart-kind"
            onChange={() => setChartKind("line")}
          />
          <DenseRadio
            checked={chartKind === "bar"}
            label="柱状图"
            name="cfets-chart-kind"
            onChange={() => setChartKind("bar")}
          />
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseRadio
            checked={dimension === "period"}
            label="期限"
            name="cfets-dimension"
            onChange={() => setDimension("period")}
          />
          <DenseRadio
            checked={dimension === "institution"}
            label="机构"
            name="cfets-dimension"
            onChange={() => setDimension("institution")}
          />
        </DenseOptionRow>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-3 pt-4">
        <CfetsDenseChart
          chartKind={chartKind}
          data={chartData}
          metricMode={metricMode}
          title={chartTitle}
          onDetail={setActiveDetail}
        />
      </div>

      <div className="shrink-0 border-t border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-2 text-xs">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] items-center gap-3">
          <div className="truncate text-slate-300">
            {activeDetail
              ? `${activeDetail.date} · ${activeDetail.label}`
              : `${expandedRule ?? "回购比例(~2025)"} · ${selectedPeriod} · ${metricLabel}`}
          </div>
          <div className="text-slate-400">
            指标值{" "}
            <span className="font-mono text-slate-100">
              {formatCfetsDenseValue(activeDetail?.value ?? 0, metricMode)}
            </span>
          </div>
          <div className="text-slate-400">
            环比 <span className="text-emerald-300">+2.4%</span>
          </div>
          <div className="text-slate-400">
            更新时间 <span className="font-mono text-slate-100">10:53:27</span>
          </div>
          <button
            className="tk-button text-mini"
            type="button"
            onClick={() => setActiveDetail(null)}
          >
            收起明细
          </button>
        </div>
      </div>
    </div>
  );
}

function DenseOptionRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1 border-b border-[color:var(--tk-color-border-divider-dark)] px-4 py-1.5 text-xs">
      {children}
    </div>
  );
}

function DenseRadio({
  checked,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-slate-300">
      <input
        checked={checked}
        className="h-3.5 w-3.5 accent-[var(--tk-color-brand-primary)]"
        name={name}
        onChange={onChange}
        type="radio"
      />
      {label}
    </label>
  );
}

function DenseCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-slate-300">
      <input
        checked={checked}
        className="h-3.5 w-3.5 accent-[var(--tk-color-brand-primary)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}


export { CfetsInstPanel };
