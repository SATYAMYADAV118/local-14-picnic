import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';

interface Props {
  snapshot: Record<string, { income: number; expense: number }>;
}

export const FundingChart: React.FC<Props> = ({ snapshot }) => {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const node = canvas.current;
    if (!node) {
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const totals = Object.values(snapshot).reduce(
      (acc, item) => {
        return { income: acc.income + item.income, expense: acc.expense + item.expense };
      },
      { income: 0, expense: 0 }
    );

    chartRef.current = new Chart(node, {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [
          {
            data: [totals.income, totals.expense],
            backgroundColor: ['var(--l4p-primary)', 'var(--l4p-warning)'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [snapshot]);

  return <canvas ref={canvas} aria-label="Funding donut chart" role="img" />;
};
