import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zipdam: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          surface2: '#F4F4F5',
          text: '#18181B',
          muted: '#71717A',
          border: '#E4E4E7',
          gold: '#FF8F00',     // Vibrant Amber
          goldHover: '#FF6F00', // Darker Amber
          success: '#16A34A',
          danger: '#DC2626',
        }
      },
      backgroundImage: {
        // Vibrant Gradient: Sunflower Yellow -> Deep Orange
        'zipdam-gradient': 'linear-gradient(135deg, #FFC107 0%, #FF8F00 100%)',
        // Subtle Gradient: Very light warm tint -> White
        'zipdam-gradient-subtle': 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
};
export default config;