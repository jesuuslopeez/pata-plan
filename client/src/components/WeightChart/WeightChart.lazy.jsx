import { lazy, Suspense } from 'react';

const WeightChartInner = lazy(() =>
  import('./WeightChart').then((m) => ({ default: m.WeightChart }))
);

export function WeightChart(props) {
  return (
    <Suspense fallback={<div className="chart-fallback" aria-hidden="true" />}>
      <WeightChartInner {...props} />
    </Suspense>
  );
}
