#!/usr/bin/env bash
# Starts one standalone HotelsVendors release with secrets kept outside Git.
#
# Required environment:
#   HV_RUNTIME_ENV_FILE  absolute path to a mode-600 shell environment file
#   PORT                 listener port for this release
#   HV_RELEASE_ID        human-readable immutable release identifier
#   HV_SOURCE_SHA        Git commit represented by this artifact

set -euo pipefail

: "${HV_RUNTIME_ENV_FILE:?HV_RUNTIME_ENV_FILE must name a protected runtime environment file}"
: "${PORT:?PORT must be set}"
: "${HV_RELEASE_ID:?HV_RELEASE_ID must be set}"
: "${HV_SOURCE_SHA:?HV_SOURCE_SHA must be set}"

if [[ ! -f "$HV_RUNTIME_ENV_FILE" ]]; then
  echo "Protected runtime environment file does not exist" >&2
  exit 64
fi

if [[ ! -r "$HV_RUNTIME_ENV_FILE" ]]; then
  echo "Protected runtime environment file is not readable" >&2
  exit 64
fi

# shellcheck source=/dev/null
source "$HV_RUNTIME_ENV_FILE"
exec node .next/standalone/server.js
