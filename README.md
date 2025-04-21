# aal-frontend

Repo for frontend of our app.

---

## Features

-   [Expo](https://expo.dev/) (SDK 52+) managed workflow with over-the-air updates
-   TypeScript for type safety
-   [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
-   [Tanstack-Query](https://tanstack.com/query/latest) for api connection
-   ESLint and Prettier configured

---

## Prerequisites

Install:

-   [Node.js](https://nodejs.org/) v20+
-   npm
-   Expo CLI (optional)

---

## Installation

1. Clone the repo:

```bash
git clone https://github.com/AudioAnalyseApp/aal-frontend.git
cd aal-frontend
npm i
```

2. Run the app:

```bash
npm start
```

3. Connect your smartphone via [Expo Go](https://expo.dev/go) and scan the QR-Code

## Project Structure

```bash
src/
  api/              # Api models and functions
  assets/           # Images, fonts
  components/       # UI components
  pages/            # App screens / pages
  hooks/            # Custom hooks
  tools/            # Utility functions
  types/            # Globally used types
  App.tsx           # Entry point
```

## Contributing

1. Branch of `development`
2. Push to your branch
3. Create a PR to `development`

## Required VS Code extensions

-   https://marketplace.visualstudio.com/items/?itemName=esbenp.prettier-vscode
-   https://marketplace.visualstudio.com/items/?itemName=bradlc.vscode-tailwindcss
-   https://marketplace.visualstudio.com/items/?itemName=dbaeumer.vscode-eslint

## Recommended VS Code extensions

-   https://marketplace.visualstudio.com/items/?itemName=dsznajder.es7-react-js-snippets
-   https://marketplace.visualstudio.com/items/?itemName=usernamehw.errorlens
-   https://marketplace.visualstudio.com/items/?itemName=csstools.postcss
