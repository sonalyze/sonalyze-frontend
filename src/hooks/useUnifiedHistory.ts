import { useQuery } from '@tanstack/react-query';
import { getMeasurements } from '../api/measurementRequests';
import { getRooms } from '../api/roomRequests';

export type UnifiedItem<T> = {
	id: string;
	createdAt: string;
	raw: T;
	type: 'measurement' | 'room';
};

export function useUnifiedHistory(limit?: number) {
	const measurementsQuery = useQuery<Measurement[], Error>({
		queryKey: ['measurements'],
		queryFn: getMeasurements,
		refetchOnWindowFocus: true,
	});
	const roomsQuery = useQuery<Room[], Error>({
		queryKey: ['rooms'],
		queryFn: getRooms,
		refetchOnWindowFocus: true,
	});

	const isLoading = measurementsQuery.isLoading || roomsQuery.isLoading;
	const error = measurementsQuery.error || roomsQuery.error;

	const measurements = measurementsQuery.data ?? [];
	const rooms = roomsQuery.data ?? [];

	const combined = [
		...measurements.map<UnifiedItem<Measurement>>((m) => ({
			id: m.id,
			createdAt: m.createdAt,
			raw: m,
			type: 'measurement',
		})),
		...rooms.map<UnifiedItem<Room>>((r) => ({
			id: r.id,
			createdAt: r.lastUpdatedAt,
			raw: r,
			type: 'room',
		})),
	].sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	function refresh() {
		measurementsQuery.refetch();
		roomsQuery.refetch();
	}

	return {
		isLoading,
		error,
		items: limit != null ? combined.slice(0, limit) : combined,
		refresh,
	};
}
