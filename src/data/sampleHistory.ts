//Beispieldaten Verlauf
import { HistoryItemData } from '../components/HistoryItem';

export const sampleHistory: HistoryItemData[] = [
  {
    id: '1',
    name: 'Test Messung Wohnzimmer',
    createdAt: '2025-06-01T14:30:00Z',
    isOwner: true,
    values: [[{ rt60: [0.45, 0.5], c50: [8.1], c80: [10.3], g: [5.2], d50: [0.62] }]]
  },
  {
    id: '2',
    name: 'Messung Büro',
    createdAt: '2025-05-28T09:15:00Z',
    isOwner: false,
    values: [[{ rt60: [0.6], c50: [9.0], c80: [11.0], g: [4.9], d50: [0.7] }]]
  },
  {
    id: '3',
    name: 'Schlafzimmer Analyse',
    createdAt: '2025-05-22T20:45:00Z',
    isOwner: true,
    values: [[{ rt60: [0.55], c50: [7.3], c80: [9.4], g: [4.8], d50: [0.65] }]]
  },
  {
    id: '4',
    name: 'Garage Messung',
    createdAt: '2025-05-19T18:00:00Z',
    isOwner: false,
    values: [[{ rt60: [0.9], c50: [6.2], c80: [8.0], g: [3.6], d50: [0.58] }]]
  },
  {
    id: '5',
    name: 'Kellerstudie',
    createdAt: '2025-05-15T11:25:00Z',
    isOwner: true,
    values: [[{ rt60: [0.72], c50: [7.0], c80: [9.1], g: [4.2], d50: [0.6] }]]
  },
  {
    id: '6',
    name: 'Test Sitzung Besprechungsraum',
    createdAt: '2025-05-12T16:10:00Z',
    isOwner: false,
    values: [[{ rt60: [0.66], c50: [8.5], c80: [10.5], g: [5.1], d50: [0.71] }]]
  },
  {
    id: '7',
    name: 'Flur Simulation',
    createdAt: '2025-05-09T08:00:00Z',
    isOwner: true,
    values: [[{ rt60: [0.4], c50: [7.8], c80: [9.9], g: [5.0], d50: [0.68] }]]
  },
  {
    id: '8',
    name: 'Bibliothek',
    createdAt: '2025-05-06T13:35:00Z',
    isOwner: false,
    values: [[{ rt60: [0.5], c50: [8.4], c80: [10.2], g: [5.5], d50: [0.69] }]]
  },
  {
    id: '9',
    name: 'Labor Messung',
    createdAt: '2025-05-03T10:20:00Z',
    isOwner: true,
    values: [[{ rt60: [0.77], c50: [6.9], c80: [8.8], g: [4.6], d50: [0.6] }]]
  },
  {
    id: '10',
    name: 'Küchenanalyse',
    createdAt: '2025-05-01T17:50:00Z',
    isOwner: false,
    values: [[{ rt60: [0.58], c50: [7.7], c80: [9.6], g: [4.4], d50: [0.63] }]]
  }
];

