#!/bin/bash

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Fix TypeScript config issue by creating a JS version of the config
echo "Creating JS version of Vite config..."
cat > vite.config.js << 'EOL'
const { defineConfig, loadEnv } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  const config = {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Copy public assets to dist
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Define global env variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };

  return config;
});
EOL

# Clean up any previous build artifacts
echo "Cleaning dist directory..."
rm -rf dist

# Explicitly run vite from node_modules
echo "Building client-side app..."
./node_modules/.bin/vite build

echo "Build process completed!"
ls -la
echo "Dist directory:"
ls -la dist