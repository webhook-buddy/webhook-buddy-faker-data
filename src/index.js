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
    const domain = email.split('@')[1];
    const from = 'do-not-reply@acme.org';
    const subject = faker.lorem.sentence(4).replace('.', '');
    const key = faker.random.uuid().replace(/-/g, '');
    const url = `https://se.api.mailgun.net/v3/domains/mg.acme.org/messages/${key}`;
    const ip = faker.internet.ip();

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

    row.body = [row.body, 'from', 'sender'].reduce((acc, cur) =>
      acc.replace(
        new RegExp(`("${cur}": ")(.*?)(",)`, 'g'),
        `$1${from}$3`,
      ),
    );

    row.body = row.body.replace(
      /("subject": ")(.*?)(")/g,
      `$1${subject}$3`,
    );

    row.body = row.body.replace(
      /("sending-ip": ")(.*?)(")/g,
      `$1${ip}$3`,
    );

    row.body = row.body.replace(/("key": ")(.*?)(")/g, `$1${key}$3`);
    row.body = row.body.replace(/("url": ")(.*?)(")/g, `$1${url}$3`);

    row.body = row.body.replace(
      /("mx-host": ")(.*?)(")/g,
      `$1smtp.${domain}$3`,
    );

    row.body = row.body.replace(
      /("recipient-domain": ")(.*?)(")/g,
      `$1${domain}$3`,
    );

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].envelope &&
      row.body_json['event-data'].envelope.targets
    )
      row.body_json['event-data'].envelope.targets = email;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].envelope &&
      row.body_json['event-data'].envelope.sender
    )
      row.body_json['event-data'].envelope.sender = from;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].envelope &&
      row.body_json['event-data'].envelope['sending-ip']
    )
      row.body_json['event-data'].envelope['sending-ip'] = ip;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].message &&
      row.body_json['event-data'].message.headers &&
      row.body_json['event-data'].message.headers.to
    )
      row.body_json['event-data'].message.headers.to = email;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].message &&
      row.body_json['event-data'].message.headers &&
      row.body_json['event-data'].message.headers.from
    )
      row.body_json['event-data'].message.headers.from = from;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].message &&
      row.body_json['event-data'].message.headers &&
      row.body_json['event-data'].message.headers.subject
    )
      row.body_json['event-data'].message.headers.subject = subject;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].recipient
    )
      row.body_json['event-data'].recipient = email;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].storage &&
      row.body_json['event-data'].storage.key
    )
      row.body_json['event-data'].storage.key = key;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data'].storage &&
      row.body_json['event-data'].storage.url
    )
      row.body_json['event-data'].storage.url = url;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data']['delivery-status'] &&
      row.body_json['event-data']['delivery-status']['mx-host']
    )
      row.body_json['event-data']['delivery-status'][
        'mx-host'
      ] = `smtp.${domain}`;

    if (
      row.body_json['event-data'] &&
      row.body_json['event-data']['recipient-domain']
    )
      row.body_json['event-data']['recipient-domain'] = domain;

    if (row.headers['Content-Length'])
      row.headers['Content-Length'] = row.body.length + '';

    console.log('');
    console.log('Cleansed:');
    console.log('');
    console.log(row);

    await pool.query(
      `
        UPDATE webhooks
        SET
          body = $1,
          body_json = $2,
          headers = $3
        WHERE id = $4
      `,
      [row.body, row.body_json, row.headers, row.id],
    );
  }
}
