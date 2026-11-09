-- Read-only inventory for the current public schema. Run in Supabase SQL Editor
-- and return the result before any migration is authored or executed.
select
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
order by c.table_name, c.ordinal_position;

select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_schema = kcu.constraint_schema
  and tc.constraint_name = kcu.constraint_name
left join information_schema.constraint_column_usage ccu
  on tc.constraint_schema = ccu.constraint_schema
  and tc.constraint_name = ccu.constraint_name
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name, kcu.ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
from pg_tables
where schemaname = 'public'
order by tablename;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

select
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
