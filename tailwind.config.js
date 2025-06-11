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
				secondary: '#e8e8e8',
				secondaryForeground: '#000000',
				destructive: '#FF3B30',
				destructiveForeground: '#ffffff',
				background: '#ffffff',
				foreground: '#000000',
				cardBackground: '#f5f6fc',
				cardForeground: '#2e2e2e',
				tileBackground: '#f5f6fc',
				tileForeground: '#2e2e2e',
				warnBackground: '#FF3B30',
				editForeground: '#007AFF',
			},
		},
	},
	plugins: [],
};
