#!/bin/bash
# Restart HotelsVendors from /var/www/hv-deploy/
kill -9 $(cat /var/run/hv-deploy.pid 2>/dev/null) $(pgrep -f 'node server.js') 2>/dev/null
sleep 2
cd /var/www/hv-deploy
nohup node server.js > /var/log/hv-prod.out 2>&1 < /dev/null &
echo $! > /var/run/hv-deploy.pid
sleep 3
echo "Started from $(pwd) PID: $(cat /var/run/hv-deploy.pid)"
ss -tlnp | grep ':3000'
md5sum server.js | cut -d' ' -f1
