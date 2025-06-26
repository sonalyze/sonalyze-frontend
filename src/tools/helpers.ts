import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export const axiosClient = axios.create({
	baseURL: 'https://api.dev.sonalyze.de',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer 685d19145e0bec065e1b5ff6',
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
		transports: ['polling'],
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
