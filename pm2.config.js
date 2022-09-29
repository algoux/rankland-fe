const path = require('path');

module.exports = {
  apps: [
    {
      name: 'rankland-fe',
      cwd: './',
      script: `./server/index.js`,
      max_memory_restart: '500M',
      // exec_mode: 'cluster',
      // instances: process.env.WORKERS || 1,
      out_file: path.join(__dirname, `logs/pm2-out.log`),
      error_file: path.join(__dirname, `logs/pm2-error.log`),
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      min_uptime: '5s',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
