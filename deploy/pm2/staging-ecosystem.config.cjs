/**
 * Staging-only PM2 manifest for a built standalone release.
 *
 * Invoke with the immutable release values exported by the release operator:
 *   HV_RUNTIME_ENV_FILE=/etc/hotelsvendors/pre-spend-staging.sh \
 *   HV_RELEASE_ID=pre-spend-<sha>-<date> \
 *   HV_SOURCE_SHA=<full-sha> \
 *   HV_RELEASE_DIR=/var/www/hv-releases/<immutable-release-directory> \
 *   PORT=3060 \
 *   pm2 start deploy/pm2/staging-ecosystem.config.cjs --only hotels-vendors-pre-spend-staging
 *
 * The referenced environment file is intentionally not in this repository.
 */
const required = ["HV_RUNTIME_ENV_FILE", "HV_RELEASE_ID", "HV_SOURCE_SHA", "HV_RELEASE_DIR", "PORT"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required to launch a protected staging release`);
  }
}

module.exports = {
  apps: [{
    name: "hotels-vendors-pre-spend-staging",
    cwd: process.env.HV_RELEASE_DIR,
    script: "deploy/pm2/start-protected.sh",
    interpreter: "bash",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: process.env.PORT,
      HV_RUNTIME_ENV_FILE: process.env.HV_RUNTIME_ENV_FILE,
      HV_RELEASE_ID: process.env.HV_RELEASE_ID,
      HV_SOURCE_SHA: process.env.HV_SOURCE_SHA,
    },
  }],
};
