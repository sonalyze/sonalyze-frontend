// @TODO: Extract colors to an object.

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				primary: '#C3E7FF',
				primaryForeground: '#000000',
				background: '#ffffff',
				foreground: '#000000',
				cardBackground: '#f5f6fc',
				cardForeground: '#2e2e2e',
				tileBackground: '#f5f6fc',
				tileForeground: '#2e2e2e',
			},
		},
	},
	plugins: [],
};
