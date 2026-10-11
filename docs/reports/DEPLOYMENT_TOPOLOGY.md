# Deployment topology — 2026-10-11

```text
GitHub repository (unreconciled branch/SHA)
        ↓ package provenance missing
VPS release directory: /var/www/hv-releases/hv-integration-356ef-20261009
        ↓ PM2: hotels-vendors-role-images
Next.js process: PID 740209, port 3057
        ↓ Nginx upstream nextjs → 127.0.0.1:3057
https://www.hotelsvendors.com
```

## Staging topology

```text
commit abf1562
  → /var/www/hv-releases/pre-spend-abf1562-20261011
  → PM2 hotels-vendors-pre-spend-staging
  → isolated loopback listener
  → health releaseId/sourceCommit present
```

## Risk

There are many active PM2 candidate processes, including several historical release directories. They were neither stopped nor deleted because the exact retention targets have not been approved. Production deployment must not reuse PM2 reload semantics that retain an old working directory; start the named candidate from its immutable release directory and verify its PID/cwd/port afterward.
