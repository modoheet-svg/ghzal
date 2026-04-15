module.exports = {
  apps: [{
    name: 'ghazal-new',
    script: 'server.js',
    cwd: '/var/www/ghazal-iraq',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://ghazal:ghazal2024@localhost:5432/ghazaldb',
      ADMIN_TOKEN: 'ghazal-admin-2024'
    }
  }]
}
