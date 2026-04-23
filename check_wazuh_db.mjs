import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[1]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'ng_sentra',
});

try {
  const [rows] = await connection.execute('SELECT * FROM wazuh_settings LIMIT 1');
  console.log('Wazuh Settings in DB:', JSON.stringify(rows, null, 2));
} catch (error) {
  console.error('Error querying database:', error.message);
}

await connection.end();
