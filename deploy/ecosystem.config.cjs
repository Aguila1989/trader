// PM2 process-manager config — the cross-platform alternative to the systemd
// unit (deploy/atrium.service). Use ONE of the two, not both.
//
//   npm i -g pm2
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save && pm2 startup        # survive a server reboot
//   pm2 status | pm2 logs atrium
//
// After a code deploy: rebuild, then `pm2 restart atrium`.
//
// This gives the bot auto-restart on crash so it no longer stays dead, with a
// crash-loop backstop (min_uptime + max_restarts) matching the systemd unit.
module.exports = {
  apps: [
    {
      name: "atrium",
      script: "npm",
      args: "start",
      // adjust to your checkout path on the server:
      cwd: "/opt/atrium",
      autorestart: true,
      // Consider a restart "successful" only if the process stayed up 30s;
      // give up after 10 rapid failures so a broken deploy doesn't thrash.
      min_uptime: "30s",
      max_restarts: 10,
      restart_delay: 5000,
      // Single instance: the app holds in-process state (SSE stream, schedulers,
      // execution lock) and must NOT be clustered.
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
