import { lazy, Suspense } from 'react';

const CategoryChartInner = lazy(() =>
  import('./CategoryChart').then((m) => ({ default: m.CategoryChart }))
);

export function CategoryChart(props) {
  return (
    <Suspense fallback={<div className="chart-fallback" aria-hidden="true" />}>
      <CategoryChartInner {...props} />
    </Suspense>
  );
}
