import axios from 'axios';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

export const axiosClient = axios.create({
	baseURL: 'https://api.dev.sonalyze.de',
	headers: {
		'Content-Type': 'application/json',
	},
});

/**
 * Creates a new Socket.IO client instance.
 * @param url The base URL of the Socket.IO server.
 * @param userToken The user token for authentication.
 * @returns Socket instance.
 */
export function createSocket(url: string, userToken: string): Socket {
	return io(url, {
		transports: [Platform.OS === 'web' ? 'websocket' : 'polling'],
		autoConnect: false,
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
		auth: { token: userToken },
	});
}

export function haveSameKeys(a: object, b: object): boolean {
	const aKeys = Object.keys(a).sort();
	const bKeys = Object.keys(b).sort();
	return (
		aKeys.length === bKeys.length &&
		aKeys.every((key, i) => key === bKeys[i])
	);
}

export function createEmpyRoomScene(): RoomScene {
	return {
		dimensions: { width: '', height: '', depth: '' },
		microphones: [{ x: '', y: '', z: '' }],
		speakers: [{ x: '', y: '', z: '' }],
		furniture: [],
		materials: {
			ceiling: '',
			floor: '',
			north: '',
			west: '',
			east: '',
			south: '',
		},
		roomId: '-1',
	};
}

export function validateRoomScene(scene: RoomScene): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	const isValidFloat = (s: string) => {
		if (s.trim() === '') return false;
		const n = Number(s);
		return !isNaN(n) && isFinite(n);
	};

	for (const dim of ['width', 'height', 'depth'] as const) {
		const val = scene.dimensions[dim];
		if (!isValidFloat(val)) {
			errors.push(`dimensions.${dim} is not a valid float: "${val}"`);
		}
	}

	for (const face of [
		'east',
		'west',
		'north',
		'south',
		'floor',
		'ceiling',
	] as const) {
		const mat = scene.materials[face];
		if (!mat.trim()) errors.push(`materials.${face} must not be empty`);
	}

	scene.furniture.forEach((furn, fi) => {
		if (!isValidFloat(furn.height)) {
			errors.push(
				`furniture[${fi}].height is not a valid float: "${furn.height}"`
			);
		}
		if (!Array.isArray(furn.points) || furn.points.length === 0) {
			errors.push(`furniture[${fi}].points must be a non-empty array`);
		} else {
			furn.points.forEach((pt, pi) => {
				if (!isValidFloat(pt.x))
					errors.push(
						`furniture[${fi}].points[${pi}].x invalid float: "${pt.x}"`
					);
				if (!isValidFloat(pt.y))
					errors.push(
						`furniture[${fi}].points[${pi}].y invalid float: "${pt.y}"`
					);
			});
		}
	});

	scene.microphones.forEach((mic, mi) => {
		['x', 'y', 'z'].forEach((coord) => {
			const v = mic[coord as 'x' | 'y' | 'z'];
			if (!isValidFloat(v))
				errors.push(
					`microphones[${mi}].${coord} invalid float: "${v}"`
				);
		});
	});

	scene.speakers.forEach((sp, si) => {
		['x', 'y', 'z'].forEach((coord) => {
			const v = sp[coord as 'x' | 'y' | 'z'];
			if (!isValidFloat(v))
				errors.push(`speakers[${si}].${coord} invalid float: "${v}"`);
		});
	});

	return { valid: errors.length === 0, errors };
}

export function timeAgo(date: Date | string): string {
	const thenDate = typeof date === 'string' ? new Date(date) : date;
	const thenUTCms = asUTC(thenDate);
	const nowUTCms = Date.now();
	let delta = Math.round((nowUTCms - thenUTCms) / 1000);
	if (delta < 0) delta = 0;

	const intervals: { label: string; seconds: number }[] = [
		{ label: 'y', seconds: 31536000 },
		{ label: 'mo', seconds: 2592000 },
		{ label: 'w', seconds: 604800 },
		{ label: 'd', seconds: 86400 },
		{ label: 'h', seconds: 3600 },
		{ label: 'm', seconds: 60 },
		{ label: 's', seconds: 1 },
	];

	for (const { label, seconds } of intervals) {
		const count = Math.floor(delta / seconds);
		if (count >= 1) return `${count}${label} ago`;
	}
	return 'just now';
}

function asUTC(d: Date) {
	// getTime() is UTC-ms, but if `new Date(str)` was parsed as local,
	// adding the offset moves you back to the "true" UTC timestamp
	return d.getTime() - d.getTimezoneOffset() * 60_000;
}
