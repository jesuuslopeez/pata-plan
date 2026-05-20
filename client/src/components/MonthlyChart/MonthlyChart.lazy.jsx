import { lazy, Suspense } from 'react';

const MonthlyChartInner = lazy(() =>
  import('./MonthlyChart').then((m) => ({ default: m.MonthlyChart }))
);

export function MonthlyChart(props) {
  return (
    <Suspense fallback={<div className="chart-fallback" aria-hidden="true" />}>
      <MonthlyChartInner {...props} />
    </Suspense>
  );
}
