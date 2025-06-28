// @TODO: Extract colors to an object.

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		screens: {
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px',
		},
		extend: {
			colors: {
				primary: '#1658A3',
				primaryForeground: '#FFF',
				secondary: 'hsl(0, 0%, 95%)',
				secondaryForeground: '#000',
				destructive: '#FF3B30',
				destructiveForeground: '#ffffff',
				background: 'hsl(0, 0%, 95%)',
				foreground: '#000',
				cardBackground: 'hsl(0, 0%, 99%)',
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
