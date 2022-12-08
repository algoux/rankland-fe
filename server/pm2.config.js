module.exports = {
  apps: [
    {
      name: 'rankland-fe',
      cwd: '../',
      script: `server/index.js`,
      max_memory_restart: '500M',
      exec_mode: 'cluster',
      instances: parseInt(process.env.WORKERS, 10) || 1,
      out_file: `logs/pm2-out.log`,
      error_file: `logs/pm2-error.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      min_uptime: '5s',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
