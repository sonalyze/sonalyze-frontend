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
  Filler,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

type Props = {
  data: number[];  // die komplette Waveform
  title: string;
  factor?: number;
};

export default function WaveformEnvelopePlot({ data, title, factor = 100 }: Props) {
  const minPeaks: number[] = [];
  const maxPeaks: number[] = [];
  const labels: number[] = [];

  for (let i = 0; i < data.length; i += factor) {
    const chunk = data.slice(i, i + factor);
    minPeaks.push(Math.min(...chunk));
    maxPeaks.push(Math.max(...chunk));
    labels.push(i); // Sample-Index pro Chunk
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Max',
        data: maxPeaks,
        borderColor: 'rgba(34,197,94,1)',
        backgroundColor: 'rgba(34,197,94,0.3)',
        pointRadius: 0,
        fill: '-1', // -> füllt zwischen Max & Min
      },
      {
        label: 'Min',
        data: minPeaks,
        borderColor: 'rgba(34,197,94,1)',
        pointRadius: 0,
        fill: false,
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
      x: { title: { display: true, text: 'Sample Index' } },
      y: {
        title: { display: true, text: 'Amplitude' },
        suggestedMin: -1,
        suggestedMax: 1,
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
