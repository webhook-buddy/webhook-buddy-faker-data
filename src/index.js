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

(async function () {
  // await cleansSendgrid();
  // await cleansMailgun();
})();

async function cleansSendgrid() {
  const hooks = `
    SELECT id, headers, body, body_json
    FROM public.webhooks
    where endpoint_id = $1
    order by id;
  `;

  const { rows } = await pool.query(hooks, [2]);

  for (const row of rows) {
    console.log(
      `----------------------------- NEW ROW: ${row.id}-----------------------------`,
    );
    console.log(row);
    const email = faker.internet.exampleEmail();
    row.body = row.body.replace(
      /("email":")(.*?)(")/g,
      `$1${email}$3`,
    );

    for (const jsonItem of row.body_json)
      if (jsonItem.email) jsonItem.email = email;

    if (row.headers['Content-Length'])
      row.headers['Content-Length'] = row.body.length + '';

    console.log('');
    console.log('Cleansed:');
    console.log('');
    console.log(row);

    // Stringify body_json for arrays, otherwise an exception will be thrown: https://github.com/brianc/node-postgres/issues/442
    await pool.query(
      `
        UPDATE webhooks
        SET
          body = $1,
          body_json = $2,
          headers = $3
        WHERE id = $4
      `,
      [row.body, JSON.stringify(row.body_json), row.headers, row.id],
    );
  }
}

async function cleansMailgun() {
  const hooks = `
    SELECT id, headers, body, body_json
    FROM public.webhooks
    where endpoint_id = $1
    order by id;
  `;

  const { rows } = await pool.query(hooks, [27]);

  for (const row of rows) {
    console.log(
      `----------------------------- NEW ROW: ${row.id}-----------------------------`,
    );
    console.log(row);
    const email = faker.internet.exampleEmail();
    row.body = [
      row.body,
      'targets',
      'to',
      'recipient',
    ].reduce((acc, cur) =>
      acc.replace(
        new RegExp(`("${cur}": ")(.*?)(")`, 'g'),
        `$1${email}$3`,
      ),
    );

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].envelope &&
      row.body_json['event-data'].envelope.targets
    )
      row.body_json['event-data'].envelope.targets = email;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].message &&
      row.body_json['event-data'].message.headers &&
      row.body_json['event-data'].message.headers.to
    )
      row.body_json['event-data'].message.headers.to = email;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].recipient
    )
      row.body_json['event-data'].recipient = email;

    if (row.headers['Content-Length'])
      row.headers['Content-Length'] = row.body.length + '';

    console.log('');
    console.log('Cleansed:');
    console.log('');
    console.log(row);

    // Stringify is not necessary for body_json here b/c it's an object, but left it in here for consistency with cleansSendgrid()
    await pool.query(
      `
        UPDATE webhooks
        SET
          body = $1,
          body_json = $2,
          headers = $3
        WHERE id = $4
      `,
      [row.body, JSON.stringify(row.body_json), row.headers, row.id],
    );
  }
}
