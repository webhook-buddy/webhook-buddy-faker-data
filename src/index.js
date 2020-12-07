import 'dotenv/config';
import { Pool } from 'pg';
import faker from 'faker';

const pool = new Pool({
  database: process.env.DATABASE,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
});

(async function () {})();

async function cleansSendgrid() {
  const hooks = `
    SELECT id, body, body_json
    FROM public.webhooks
    where endpoint_id = $1;
  `;

  const { rows } = await pool.query(hooks, [2]);

  for (const row of rows) {
    console.log(
      `----------------------------- NEW ROW: ${row.id}-----------------------------`,
    );
    console.log(row);
    const email = faker.internet.email();
    row.body = row.body.replace(
      /("email":")(.*?)(")/g,
      `$1${email}$3`,
    );

    for (const jsonItem of row.body_json)
      if (jsonItem.email) jsonItem.email = email;

    console.log('');
    console.log('Cleansed:');
    console.log('');
    console.log(row);

    await pool.query(
      `
        UPDATE webhooks
        SET
          body = $1,
          body_json = $2
        WHERE id = $3
      `,
      [row.body, JSON.stringify(row.body_json), row.id],
    );
  }
}
