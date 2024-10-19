const configs = {
  atten: {
    user: 'essl',
    password: 'essl',
    server: '192.168.100.73\\GLPLSQLSRV1',
    database: 'Atten',
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
  etimetracklite1: {
    user: 'essl',
    password: 'essl',
    server: '192.168.100.73\\GLPLSQLSRV1',
    database: 'etimetracklite1',
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
  // Add more database configurations as needed
};

export default configs;  // Change this line to use ES module export
