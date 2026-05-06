const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres:123456@localhost:5432/construction_erp"
  });
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, column_name;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

checkSchema().catch(console.error);
