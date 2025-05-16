// src/components/WaveformPlot.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

type Props = {
  data: number[];
  title: string;
};

export default function WaveformPlot({ data, title }: Props) {
  const labels = data.map((_, i) => i);

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: '#10b981',
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
    },
    scales: {
      x: {
        title: { display: true, text: 'Sample Index' },
        ticks: { autoSkip: true, maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: 'Amplitude' },
        suggestedMin: -1,
        suggestedMax: 1,
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
