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

// Chart.js Module registrieren
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

type Props = {
  correlation: number[];
};

export default function CorrelationPlot({ correlation }: Props) {
  const labels = correlation.map((_, i) => i - Math.floor(correlation.length / 2)); // Lag-Achse

  const data = {
    labels,
    datasets: [
      {
        label: 'Kreuzkorrelation',
        data: correlation,
        fill: false,
        borderColor: '#3b82f6',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { title: { display: true, text: 'Lag (Samples)' } },
      y: { title: { display: true, text: 'Amplitude' } },
    },
  };

  return (
    <Line data={data} options={options} />
  );
}
