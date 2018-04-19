const config = {
  user: 'momo',
  password: '123Tailor',
  server: 'momo-sql.database.windows.net', // You can use 'localhost\\instance' to connect to named instance
  database: 'ICA_UserService',
  options: {
    encrypt: true, // Use this if you're on Windows Azure
  },
};

module.exports = config;
