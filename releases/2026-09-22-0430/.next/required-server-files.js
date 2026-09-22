self.__SERVER_FILES_MANIFEST={
  "version": 1,
  "config": {
    "env": {
      "_sentryRewriteFramesDistDir": ".next",
      "_sentryRewriteFramesAssetPrefixPath": "",
      "_sentryRelease": "3c91ed8599ded5a8b06457fdcc9a8d107121903d"
    },
    "webpack": null,
    "typescript": {
      "ignoreBuildErrors": true
    },
    "typedRoutes": false,
    "distDir": ".next",
    "cleanDistDir": true,
    "assetPrefix": "",
    "cacheMaxMemorySize": 52428800,
    "configOrigin": "next.config.ts",
    "useFileSystemPublicRoutes": true,
    "generateEtags": true,
    "pageExtensions": [
      "tsx",
      "ts",
      "jsx",
      "js"
    ],
    "poweredByHeader": true,
    "compress": true,
    "images": {
      "deviceSizes": [
        640,
        750,
        828,
        1080,
        1200,
        1920,
        2048,
        3840
      ],
      "imageSizes": [
        32,
        48,
        64,
        96,
        128,
        256,
        384
      ],
      "path": "/_next/image",
      "loader": "default",
      "loaderFile": "",
      "domains": [],
      "disableStaticImages": false,
      "minimumCacheTTL": 14400,
      "formats": [
        "image/webp"
      ],
      "maximumRedirects": 3,
      "maximumResponseBody": 50000000,
      "dangerouslyAllowLocalIP": false,
      "dangerouslyAllowSVG": false,
      "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;",
      "contentDispositionType": "attachment",
      "localPatterns": [
        {
          "pathname": "**",
          "search": ""
        }
      ],
      "remotePatterns": [
        {
          "protocol": "https",
          "hostname": "images.unsplash.com"
        },
        {
          "protocol": "https",
          "hostname": "**.unsplash.com"
        },
        {
          "protocol": "https",
          "hostname": "logo.clearbit.com"
        },
        {
          "protocol": "https",
          "hostname": "**.gravatar.com"
        }
      ],
      "qualities": [
        75
      ],
      "unoptimized": false,
      "customCacheHandler": false
    },
    "devIndicators": {
      "position": "bottom-left"
    },
    "onDemandEntries": {
      "maxInactiveAge": 60000,
      "pagesBufferLength": 5
    },
    "basePath": "",
    "sassOptions": {},
    "trailingSlash": false,
    "i18n": null,
    "productionBrowserSourceMaps": true,
    "excludeDefaultMomentLocales": true,
    "reactProductionProfiling": false,
    "reactStrictMode": null,
    "reactMaxHeadersLength": 6000,
    "httpAgentOptions": {
      "keepAlive": true
    },
    "logging": {
      "serverFunctions": true,
      "browserToTerminal": "warn"
    },
    "compiler": {},
    "expireTime": 31536000,
    "staticPageGenerationTimeout": 60,
    "output": "standalone",
    "modularizeImports": {
      "@mui/icons-material": {
        "transform": "@mui/icons-material/{{member}}"
      },
      "lodash": {
        "transform": "lodash/{{member}}"
      }
    },
    "outputFileTracingRoot": "/Users/Moatazi",
    "cacheComponents": false,
    "cacheLife": {
      "default": {
        "stale": 300,
        "revalidate": 900,
        "expire": 4294967294
      },
      "seconds": {
        "stale": 30,
        "revalidate": 1,
        "expire": 60
      },
      "minutes": {
        "stale": 300,
        "revalidate": 60,
        "expire": 3600
      },
      "hours": {
        "stale": 300,
        "revalidate": 3600,
        "expire": 86400
      },
      "days": {
        "stale": 300,
        "revalidate": 86400,
        "expire": 604800
      },
      "weeks": {
        "stale": 300,
        "revalidate": 604800,
        "expire": 2592000
      },
      "max": {
        "stale": 300,
        "revalidate": 2592000,
        "expire": 31536000
      }
    },
    "cacheHandlers": {},
    "experimental": {
      "appNewScrollHandler": false,
      "useSkewCookie": false,
      "cssChunking": true,
      "multiZoneDraftMode": false,
      "appNavFailHandling": false,
      "prerenderEarlyExit": true,
      "serverMinification": true,
      "linkNoTouchStart": false,
      "caseSensitiveRoutes": false,
      "cachedNavigations": false,
      "partialFallbacks": false,
      "dynamicOnHover": false,
      "varyParams": false,
      "prefetchInlining": false,
      "preloadEntriesOnStart": true,
      "clientRouterFilter": true,
      "clientRouterFilterRedirects": false,
      "fetchCacheKeyPrefix": "",
      "proxyPrefetch": "flexible",
      "optimisticClientCache": true,
      "manualClientBasePath": false,
      "cpus": 9,
      "memoryBasedWorkersCount": false,
      "imgOptConcurrency": null,
      "imgOptTimeoutInSeconds": 7,
      "imgOptMaxInputPixels": 268402689,
      "imgOptSequentialRead": null,
      "imgOptSkipMetadata": null,
      "isrFlushToDisk": true,
      "workerThreads": false,
      "optimizeCss": false,
      "nextScriptWorkers": false,
      "scrollRestoration": false,
      "externalDir": false,
      "disableOptimizedLoading": false,
      "gzipSize": true,
      "craCompat": false,
      "esmExternals": true,
      "fullySpecified": false,
      "swcTraceProfiling": false,
      "forceSwcTransforms": false,
      "largePageDataBytes": 128000,
      "typedEnv": false,
      "clientTraceMetadata": [
        "baggage",
        "sentry-trace"
      ],
      "parallelServerCompiles": false,
      "parallelServerBuildTraces": false,
      "ppr": false,
      "authInterrupts": false,
      "webpackMemoryOptimizations": false,
      "optimizeServerReact": true,
      "strictRouteTypes": false,
      "viewTransition": false,
      "removeUncaughtErrorAndRejectionListeners": false,
      "validateRSCRequestHeaders": false,
      "staleTimes": {
        "dynamic": 0,
        "static": 300
      },
      "reactDebugChannel": true,
      "serverComponentsHmrCache": true,
      "staticGenerationMaxConcurrency": 8,
      "staticGenerationMinPagesPerWorker": 25,
      "transitionIndicator": false,
      "gestureTransition": false,
      "inlineCss": false,
      "useCache": false,
      "globalNotFound": false,
      "browserDebugInfoInTerminal": "warn",
      "lockDistDir": true,
      "proxyClientMaxBodySize": 10485760,
      "hideLogsAfterAbort": false,
      "mcpServer": true,
      "turbopackFileSystemCacheForDev": true,
      "turbopackFileSystemCacheForBuild": false,
      "turbopackInferModuleSideEffects": true,
      "turbopackPluginRuntimeStrategy": "childProcesses",
      "optimizePackageImports": [
        "lucide-react",
        "date-fns",
        "lodash-es",
        "ramda",
        "antd",
        "react-bootstrap",
        "ahooks",
        "@ant-design/icons",
        "@headlessui/react",
        "@headlessui-float/react",
        "@heroicons/react/20/solid",
        "@heroicons/react/24/solid",
        "@heroicons/react/24/outline",
        "@visx/visx",
        "@tremor/react",
        "rxjs",
        "@mui/material",
        "@mui/icons-material",
        "recharts",
        "react-use",
        "effect",
        "@effect/schema",
        "@effect/platform",
        "@effect/platform-node",
        "@effect/platform-browser",
        "@effect/platform-bun",
        "@effect/sql",
        "@effect/sql-mssql",
        "@effect/sql-mysql2",
        "@effect/sql-pg",
        "@effect/sql-sqlite-node",
        "@effect/sql-sqlite-bun",
        "@effect/sql-sqlite-wasm",
        "@effect/sql-sqlite-react-native",
        "@effect/rpc",
        "@effect/rpc-http",
        "@effect/typeclass",
        "@effect/experimental",
        "@effect/opentelemetry",
        "@material-ui/core",
        "@material-ui/icons",
        "@tabler/icons-react",
        "mui-core",
        "react-icons/ai",
        "react-icons/bi",
        "react-icons/bs",
        "react-icons/cg",
        "react-icons/ci",
        "react-icons/di",
        "react-icons/fa",
        "react-icons/fa6",
        "react-icons/fc",
        "react-icons/fi",
        "react-icons/gi",
        "react-icons/go",
        "react-icons/gr",
        "react-icons/hi",
        "react-icons/hi2",
        "react-icons/im",
        "react-icons/io",
        "react-icons/io5",
        "react-icons/lia",
        "react-icons/lib",
        "react-icons/lu",
        "react-icons/md",
        "react-icons/pi",
        "react-icons/ri",
        "react-icons/rx",
        "react-icons/si",
        "react-icons/sl",
        "react-icons/tb",
        "react-icons/tfi",
        "react-icons/ti",
        "react-icons/vsc",
        "react-icons/wi"
      ],
      "trustHostHeader": false,
      "isExperimentalCompile": false
    },
    "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight",
    "bundlePagesRouterDependencies": false,
    "configFileName": "next.config.ts",
    "outputFileTracingIncludes": {
      "/*": [
        "../node_modules/meriyah/dist/meriyah.mjs",
        "../node_modules/meriyah/dist/meriyah.cjs"
      ]
    },
    "serverExternalPackages": [
      "amqplib",
      "connect",
      "dataloader",
      "express",
      "generic-pool",
      "graphql",
      "@hapi/hapi",
      "ioredis",
      "kafkajs",
      "koa",
      "lru-memoizer",
      "mongodb",
      "mongoose",
      "mysql",
      "mysql2",
      "knex",
      "pg",
      "pg-pool",
      "@node-redis/client",
      "@redis/client",
      "redis",
      "tedious"
    ],
    "turbopack": {
      "debugIds": true,
      "rules": {
        "**/instrumentation-client.*": {
          "condition": {
            "not": "foreign"
          },
          "loaders": [
            {
              "loader": "/Users/Moatazi/node_modules/@sentry/nextjs/build/cjs/config/loaders/valueInjectionLoader.js",
              "options": {
                "values": {
                  "_sentryRouteManifest": "{\"dynamicRoutes\":[{\"path\":\"/hotel/catalog/:id\",\"regex\":\"^/hotel/catalog/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/intelligence/entities/:id\",\"regex\":\"^/intelligence/entities/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/orders/:id\",\"regex\":\"^/orders/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/supplier/orders/:id\",\"regex\":\"^/supplier/orders/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/marketplace/:product\",\"regex\":\"^/marketplace/([^/]+)$\",\"paramNames\":[\"product\"],\"hasOptionalPrefix\":false},{\"path\":\"/supplier-central/orders/:id\",\"regex\":\"^/supplier-central/orders/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false}],\"staticRoutes\":[{\"path\":\"/\"},{\"path\":\"/admin\"},{\"path\":\"/admin/audit\"},{\"path\":\"/admin/rules\"},{\"path\":\"/admin/tenants\"},{\"path\":\"/admin/users\"},{\"path\":\"/lead-generation\"},{\"path\":\"/forgot-password\"},{\"path\":\"/login\"},{\"path\":\"/pairing\"},{\"path\":\"/register\"},{\"path\":\"/reset-password\"},{\"path\":\"/verify-email\"},{\"path\":\"/agents\"},{\"path\":\"/carrier\"},{\"path\":\"/cart\"},{\"path\":\"/dashboard\"},{\"path\":\"/deliveries\"},{\"path\":\"/eta\"},{\"path\":\"/eta-compliance\"},{\"path\":\"/factoring\"},{\"path\":\"/factoring/credit-lines\"},{\"path\":\"/factoring/credit-lines/review\"},{\"path\":\"/financing\"},{\"path\":\"/hotel\"},{\"path\":\"/hotel/accounting\"},{\"path\":\"/hotel/cashflow\"},{\"path\":\"/hotel/catalog\"},{\"path\":\"/hotel/checkout\"},{\"path\":\"/hotel/consumption\"},{\"path\":\"/hotel/credit\"},{\"path\":\"/hotel/financing\"},{\"path\":\"/hotel/inventory-reconciliation\"},{\"path\":\"/hotel/invoices\"},{\"path\":\"/hotel/order\"},{\"path\":\"/hotel/properties\"},{\"path\":\"/hotel/receiving\"},{\"path\":\"/hotel/scheduled-orders\"},{\"path\":\"/intelligence\"},{\"path\":\"/intelligence/actions\"},{\"path\":\"/intelligence/discovery\"},{\"path\":\"/intelligence/entities\"},{\"path\":\"/intelligence/evidence\"},{\"path\":\"/intelligence/findings\"},{\"path\":\"/intelligence/graph\"},{\"path\":\"/intelligence/monitoring\"},{\"path\":\"/intelligence/opportunities\"},{\"path\":\"/intelligence/sources\"},{\"path\":\"/invoices\"},{\"path\":\"/jarvis\"},{\"path\":\"/marketing\"},{\"path\":\"/marketing/analytics\"},{\"path\":\"/marketing/calendar\"},{\"path\":\"/marketing/campaigns\"},{\"path\":\"/marketing/leads\"},{\"path\":\"/marketing/social\"},{\"path\":\"/onboarding\"},{\"path\":\"/orders\"},{\"path\":\"/payments\"},{\"path\":\"/receiving\"},{\"path\":\"/settings\"},{\"path\":\"/shared/support\"},{\"path\":\"/shipping\"},{\"path\":\"/supplier\"},{\"path\":\"/supplier/analytics\"},{\"path\":\"/supplier/cashflow\"},{\"path\":\"/supplier/catalog\"},{\"path\":\"/supplier/credit\"},{\"path\":\"/supplier/credit-facility\"},{\"path\":\"/supplier/factoring-activation\"},{\"path\":\"/supplier/financing\"},{\"path\":\"/supplier/orders\"},{\"path\":\"/supplier/products\"},{\"path\":\"/supplier/products/new\"},{\"path\":\"/\"},{\"path\":\"/about\"},{\"path\":\"/ai-catalog\"},{\"path\":\"/analytics\"},{\"path\":\"/become-supplier\"},{\"path\":\"/categories\"},{\"path\":\"/compliance\"},{\"path\":\"/contact\"},{\"path\":\"/demo\"},{\"path\":\"/demo/checkout\"},{\"path\":\"/erp-integrations\"},{\"path\":\"/factoring-service\"},{\"path\":\"/flow\"},{\"path\":\"/food-cost-calculator\"},{\"path\":\"/founder\"},{\"path\":\"/fra-shield\"},{\"path\":\"/funders\"},{\"path\":\"/help\"},{\"path\":\"/hotels\"},{\"path\":\"/hotels/join\"},{\"path\":\"/hovin\"},{\"path\":\"/insights/fmcg\"},{\"path\":\"/invite-supplier\"},{\"path\":\"/logistics-service\"},{\"path\":\"/marketplace\"},{\"path\":\"/marketplace/checkout\"},{\"path\":\"/offline\"},{\"path\":\"/oliv/referral\"},{\"path\":\"/oliv-financing\"},{\"path\":\"/payment-rails\"},{\"path\":\"/platform\"},{\"path\":\"/pricing\"},{\"path\":\"/privacy\"},{\"path\":\"/rfq\"},{\"path\":\"/sandbox\"},{\"path\":\"/social-media\"},{\"path\":\"/solutions\"},{\"path\":\"/storefront\"},{\"path\":\"/suppliers\"},{\"path\":\"/suppliers/join\"},{\"path\":\"/support\"},{\"path\":\"/terms\"},{\"path\":\"/vat-invoicing\"},{\"path\":\"/yield-calculator\"},{\"path\":\"/admin_new_untracked\"},{\"path\":\"/admin_new_untracked/audit\"},{\"path\":\"/admin_new_untracked/rules\"},{\"path\":\"/admin_new_untracked/tenants\"},{\"path\":\"/admin_new_untracked/users\"},{\"path\":\"/integrations\"},{\"path\":\"/inventory\"},{\"path\":\"/sourcing\"},{\"path\":\"/sso-callback\"},{\"path\":\"/supplier-central\"},{\"path\":\"/supplier-central/catalog\"},{\"path\":\"/supplier-central/orders\"},{\"path\":\"/vendor-management\"},{\"path\":\"/working-capital\"}],\"isrRoutes\":[]}",
                  "_sentryNextJsVersion": "16.2.6"
                }
              }
            }
          ]
        },
        "**/instrumentation.*": {
          "condition": {
            "not": "foreign"
          },
          "loaders": [
            {
              "loader": "/Users/Moatazi/node_modules/@sentry/nextjs/build/cjs/config/loaders/valueInjectionLoader.js",
              "options": {
                "values": {
                  "__SENTRY_SERVER_MODULES__": {
                    "@ai-sdk/react": "^3.0.179",
                    "@fontsource/plus-jakarta-sans": "^5.2.8",
                    "@gsap/react": "^2.1.2",
                    "@prisma/adapter-better-sqlite3": "^7.8.0",
                    "@prisma/adapter-pg": "^7.8.0",
                    "@prisma/client": "^6.6.0",
                    "@radix-ui/react-slot": "^1.3.0",
                    "@react-google-maps/api": "^2.20.8",
                    "@sentry/nextjs": "^10.51.0",
                    "@supabase/ssr": "^0.12.0",
                    "@supabase/supabase-js": "^2.108.1",
                    "ai": "^7.0.66",
                    "bcryptjs": "^3.0.3",
                    "better-sqlite3": "^12.9.0",
                    "bullmq": "^5.76.4",
                    "class-variance-authority": "^0.7.1",
                    "clsx": "^2.1.1",
                    "date-fns": "^4.1.0",
                    "dompurify": "^3.4.8",
                    "exceljs": "^3.4.0",
                    "framer-motion": "^12.40.0",
                    "gsap": "^3.15.0",
                    "ioredis": "^5.10.1",
                    "isomorphic-dompurify": "^3.15.0",
                    "jose": "^6.2.3",
                    "lucide-react": "^1.8.0",
                    "medo": "^1.0.0",
                    "next": "^16.3.1",
                    "next-themes": "^0.4.6",
                    "nodemailer": "^9.0.3",
                    "ollama": "^0.6.3",
                    "ollama-ai-provider": "^1.2.0",
                    "otpauth": "^9.5.1",
                    "pg": "^8.20.0",
                    "pino": "^10.3.1",
                    "postcss": "^8.5.10",
                    "qrcode": "^1.5.4",
                    "rate-limiter-flexible": "^11.1.0",
                    "react": "^18.3.1",
                    "react-dom": "^18.3.1",
                    "recharts": "^3.9.2",
                    "twilio": "^6.0.2",
                    "zod": "^4.4.1",
                    "@playwright/test": "^1.61.1",
                    "@testing-library/jest-dom": "^6.9.1",
                    "@testing-library/react": "^16.3.2",
                    "@types/bcryptjs": "^2.4.6",
                    "@types/node": "^20",
                    "@types/nodemailer": "^8.0.1",
                    "@types/pg": "^8.20.0",
                    "@types/qrcode": "^1.5.6",
                    "@types/react": "^19",
                    "@types/react-dom": "^19",
                    "@vitejs/plugin-react": "^6.0.1",
                    "autoprefixer": "^10.5.0",
                    "eslint": "^9",
                    "eslint-config-next": "16.2.4",
                    "jsdom": "^29.1.1",
                    "neonctl": "^2.22.0",
                    "playwright": "^1.59.1",
                    "prisma": "^6.6.0",
                    "sass": "^1.100.0",
                    "typescript": "^5",
                    "vitest": "^4.1.5"
                  },
                  "_sentryNextJsVersion": "16.2.6"
                }
              }
            }
          ]
        }
      },
      "root": "/Users/Moatazi"
    },
    "distDirRoot": ".next"
  },
  "appDir": "/Users/Moatazi/hotels-vendors-new",
  "relativeAppDir": "hotels-vendors-new",
  "files": [
    ".next/routes-manifest.json",
    ".next/server/pages-manifest.json",
    ".next/build-manifest.json",
    ".next/prerender-manifest.json",
    ".next/server/functions-config-manifest.json",
    ".next/server/middleware-manifest.json",
    ".next/server/middleware-build-manifest.js",
    ".next/server/app-paths-manifest.json",
    ".next/app-path-routes-manifest.json",
    ".next/server/server-reference-manifest.js",
    ".next/server/server-reference-manifest.json",
    ".next/server/prefetch-hints.json",
    ".next/BUILD_ID",
    ".next/server/next-font-manifest.js",
    ".next/server/next-font-manifest.json",
    ".next/required-server-files.json"
  ],
  "ignore": []
}