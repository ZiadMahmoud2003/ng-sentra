import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to database...');

try {
  const connection = await mysql.createConnection(dbUrl);
  
  console.log('\n=== Checking wazuh_settings table ===');
  const [rows] = await connection.execute('SELECT * FROM wazuh_settings');
  
  if (rows.length === 0) {
    console.log('❌ No Wazuh settings found in database!');
    console.log('You need to save the Wazuh configuration in System Settings first.');
  } else {
    console.log('✅ Found Wazuh settings:');
    rows.forEach((row, idx) => {
      console.log(`\n[Setting ${idx + 1}]`);
      console.log(`  Elasticsearch URL: ${row.elasticsearchUrl}`);
      console.log(`  Username: ${row.elasticsearchUsername}`);
      console.log(`  Password: ${row.elasticsearchPassword ? '***' : 'NOT SET'}`);
      console.log(`  Alert Index: ${row.alertIndexPattern}`);
      console.log(`  Enabled: ${row.enabled}`);
    });
  }
  
  await connection.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
