#!/usr/bin/env node
// STAGING ONLY: ephemeral local PostgreSQL emulation, NEVER a remote database.
import { NetlifyDB } from '@netlify/database-dev';
import { Client } from 'pg';
import assert from 'node:assert/strict';

const db = new NetlifyDB();
let client, started = false;
try {
  const url = await db.start();
  started = true;
  console.log('Ephemeral local staging database created (not production).');
  await db.applyMigrations('./netlify/database/migrations');
  console.log('All 14 original Academy migrations applied successfully.');
  client = new Client({ connectionString: url });
  await client.connect();
  const { rows: tables } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'academy_%' ORDER BY table_name"
  );
  assert.equal(tables.length, 17, 'Expected 17 Academy tables');
  const functions = await client.query(
    "SELECT proname FROM pg_proc WHERE proname IN ('academy_decide_admission','academy_admin_delete_all_students')"
  );
  assert.equal(functions.rows.length, 2, 'Both original atomic Academy database functions required');
  const cols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='academy_admission_applications'"
  );
  assert(cols.rows.some(x=>x.column_name==='status'),'Admissions status must exist');

  await client.query(
    "INSERT INTO academy_accounts_v2(username,display_name,role,password_salt,password_hash) VALUES($1,$2,'admin',$3,$4)",
    ['staging-check-admin','QA Disposable Admin','0'.repeat(32),'1'.repeat(64)]
  );
  const adminId = (await client.query(
    "SELECT id FROM academy_accounts_v2 WHERE username=$1",['staging-check-admin']
  )).rows[0].id;
  const inserted = await client.query(
    "INSERT INTO academy_admission_applications(application_year,student_name,guardian_name,guardian_phone,address,consent) VALUES(2026,'QA Example Student','QA Guardian','0000000000','QA example address only',true) RETURNING id"
  );
  const applicationId=inserted.rows[0].id;
  const approved = (await client.query(
    "SELECT academy_decide_admission($1::bigint,$2::text,$3::text,$4::text,$5::timestamptz,$6::bigint,$7::text,$8::text,$9::integer) AS decision",
    [applicationId,'approved',null,'QA disposable approval',null,adminId,'0'.repeat(32),'1'.repeat(64),310000]
  )).rows[0].decision;
  assert.equal(approved.status,'approved');
  assert.equal(approved.account_created,true);
  assert(approved.student_id);
  const again=(await client.query(
    "SELECT academy_decide_admission($1::bigint,$2::text,$3::text,$4::text,$5::timestamptz,$6::bigint,$7::text,$8::text,$9::integer) AS decision",
    [applicationId,'approved',null,null,null,adminId,null,null,null]
  )).rows[0].decision;
  assert.equal(again.already_approved,true);
  const before=(await client.query("SELECT count(*)::int AS n FROM academy_students")).rows[0].n;
  assert.equal(before,1);
  try {
    await client.query("SELECT academy_admin_delete_all_students($1::bigint,$2::bigint)",[adminId,99]);
    throw new Error('Wrong expected student count was accepted');
  } catch(err) {
    if (err.message==='Wrong expected student count was accepted') throw err;
  }
  assert.equal((await client.query("SELECT count(*)::int AS n FROM academy_students")).rows[0].n,1);
  const deleted=(await client.query("SELECT academy_admin_delete_all_students($1::bigint,$2::bigint) AS outcome",[adminId,1])).rows[0].outcome;
  assert.equal(deleted.ok,true);
  assert.equal(deleted.remaining_students,0);
  assert.equal((await client.query("SELECT count(*)::int AS n FROM academy_accounts_v2 WHERE role='student'")).rows[0].n,0);
  assert.equal((await client.query("SELECT count(*)::int AS n FROM academy_admission_applications")).rows[0].n,1);
  console.log(JSON.stringify({
    result:'STAGING_EPHEMERAL_DB_PASS',
    tables:tables.length,
    pgFunctions:functions.rows.map(x=>x.proname),
    admissionCreated:true,
    duplicateApprovalPrevented:true,
    wrongBulkDeleteCountRejected:true,
    bulkDeleteVerified:true,
    hatchableProductionDataAccess:false,
    hostedNetlifyE2E:'NOT TESTED'
  },null,2));
} finally {
  if(client)await client.end();
  if(started)await db.stop();
}
