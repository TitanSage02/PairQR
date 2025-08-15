import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite config scoped to the client/ workspace
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },
  // Build output is placed next to the server build so Express can serve it in production
  build: {
    outDir: path.resolve(import.meta.dirname, "..", "dist", "public"),
    emptyOutDir: true,
    // Performance optimizations for production
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for better caching
          vendor: ['react', 'react-dom'],
          // UI components chunk
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          // Utilities chunk
          utils: ['wouter', '@tanstack/react-query']
        }
      }
    },
    // Enable source maps for better debugging
    sourcemap: false, // Disable in production for performance
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1000 // Warn for chunks larger than 1MB
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  }
});
