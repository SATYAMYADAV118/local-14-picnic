import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';

interface Props {
  snapshot: Record<string, { income: number; expense: number }>;
}

export const LineTrendChart: React.FC<Props> = ({ snapshot }) => {
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

    const labels = Object.keys(snapshot);
    const income = labels.map((label) => snapshot[label].income);
    const expense = labels.map((label) => snapshot[label].expense);

    chartRef.current = new Chart(node, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: income,
            borderColor: 'var(--l4p-primary)',
            tension: 0.4
          },
          {
            label: 'Expense',
            data: expense,
            borderColor: 'var(--l4p-warning)',
            tension: 0.4
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

  return <canvas ref={canvas} aria-label="Income vs expense trend" role="img" />;
};
