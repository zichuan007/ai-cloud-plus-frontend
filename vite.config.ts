import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isProd = mode === "production";

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        resolvers: [ElementPlusResolver()],
        dts: "src/auto-imports.d.ts",
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: "src/components.d.ts",
      }),
      // Gzip 压缩
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 10KB 以上才压缩
        algorithm: "gzip",
        ext: ".gz",
      }),
      // 构建分析 (仅在需要时开启)
      ...(env.VITE_ANALYZE === "true"
        ? [
            visualizer({
              open: true,
              gzipSize: true,
              brotliSize: true,
              filename: "dist/stats.html",
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        // 所有 /api 请求转发到网关
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          // 保留 /api 前缀，由网关进行 StripPrefix
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/assets/styles/tokens.scss";`,
        },
      },
    },
    build: {
      // 生产环境移除 console
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      // 资源内联限制
      assetsInlineLimit: 4096, // 4KB 以下转 base64
      // 分块策略优化
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 第三方库分离
            if (id.includes("node_modules")) {
              // Element Plus 单独打包
              if (id.includes("element-plus")) return "element-plus";
              // BPMN 相关库单独打包（约 1MB）
              if (id.includes("bpmn-js") || id.includes("diagram-js"))
                return "bpmn-js";
              // Vue 生态
              if (id.includes("vue") || id.includes("pinia"))
                return "vue-vendor";
              // 工具库
              if (
                id.includes("axios") ||
                id.includes("dayjs") ||
                id.includes("lodash")
              )
                return "utils-vendor";
              // 图表库
              if (id.includes("echarts")) return "echarts";
              // 其他第三方库
              return "vendor";
            }
          },
          //  chunk 文件命名
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || "";
            if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name)) {
              return "images/[name]-[hash][extname]";
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
              return "fonts/[name]-[hash][extname]";
            }
            if (/\.css$/i.test(name)) {
              return "css/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
      //  chunk 大小警告限制
      chunkSizeWarningLimit: 1000,
    },
    // 预加载优化
    optimizeDeps: {
      include: [
        "vue",
        "vue-router",
        "pinia",
        "element-plus",
        "@element-plus/icons-vue",
        "axios",
        "dayjs",
        "echarts",
      ],
    },
  };
});
