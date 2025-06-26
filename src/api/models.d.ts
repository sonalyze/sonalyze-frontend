type Room = {
	id: string;
	name: string;
	hasSimulation: boolean;
	isOwner: boolean;
	lastUpdatedAt: string;
};

type RoomScene = {
	roomId: string;
	dimensions: {
		width: string;
		height: string;
		depth: string;
	};
	materials: {
		east: string;
		west: string;
		north: string;
		south: string;
		floor: string;
		ceiling: string;
	};
	furniture: {
		height: string;
		points: { x: string; y: string }[];
	}[];
	microphones: {
		x: string;
		y: string;
		z: string;
	}[];
	speakers: {
		x: string;
		y: string;
		z: string;
	}[];
};

type AcousticParameters = {
	rt60: number[];
	c50: number[];
	c80: number[];
	g: number[];
	d50: number[];
	ir: number[];
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
