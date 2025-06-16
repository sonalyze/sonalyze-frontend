type Room = {
	id: string;
	name: string;
	hasSimulation: boolean;
	isOwner: boolean;
	createdAt: string;
};

type RoomScene = {
	roomId: string;
	dimensions: {
		width: number;
		height: number;
		depth: number;
	};
	materials: {
		east: string;
		west: string;
		north: string;
		south: string;
		floor: string;
		ceiling: string;
	};
	furniture: [
		{
			height: number;
			points: [{ x: number; y: number }];
		},
	];
	microphones: [
		{
			x: number;
			y: number;
			z: number;
		},
	];
	speakers: [
		{
			x: number;
			y: number;
			z: number;
		},
	];
};

type AcousticParameters = {
	rt60: number[];
	c50: number[];
	c80: number[];
	g: number[];
	d50: number[];
};

type Simulation = {
	roomId: string;
	values: AcousticParameters[][];
};

type Measurement = {
	id: string;
	name: string;
	createdAt: string;
	isOwner: boolean;
	values: AcousticParameters[][];
};

type CreatedUser = {
	id: string;
};
