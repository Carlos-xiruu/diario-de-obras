-- LOCAL/STAGING ONLY. This recreates only the confirmed legacy public schema
-- and synthetic data required to homologate the migrations. Never run it in
-- production or add it to supabase/migrations.
do $$
begin
create extension if not exists pgcrypto;

create table public.obras (
  id uuid primary key default gen_random_uuid(),
  nome_obra varchar not null,
  cidade varchar not null,
  criado_em timestamptz default now()
);

create table public.diarios (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id) on delete cascade,
  data_registro date,
  equipe text,
  clima varchar,
  munk_hrs numeric,
  guindaste_hrs numeric,
  horas_trabalhadas numeric,
  m3_montado numeric,
  qtd_bisnagas_pu integer,
  eixos_montados varchar,
  encunhamento_pilares boolean,
  observacoes text,
  informacoes_adicionais text,
  criado_em timestamptz default now(),
  obra text,
  cidade text
);

alter table public.obras enable row level security;
alter table public.diarios enable row level security;
grant select, insert, update, delete on public.obras, public.diarios to anon, authenticated;
create policy "legacy obras public read write" on public.obras for all to public using (true) with check (true);
create policy "legacy diarios authenticated read" on public.diarios for select to authenticated using (true);
create policy "legacy diarios public insert" on public.diarios for insert to public with check (true);

insert into public.obras (nome_obra, cidade)
select format('Obra %s', lpad(series::text, 3, '0')), format('Cidade %s', lpad(series::text, 3, '0'))
from generate_series(1, 73) as series;

insert into public.diarios (
  data_registro, equipe, clima, munk_hrs, guindaste_hrs, horas_trabalhadas,
  m3_montado, qtd_bisnagas_pu, eixos_montados, encunhamento_pilares,
  observacoes, informacoes_adicionais, obra, cidade
)
select
  date '2026-01-01' + series,
  format('Equipe %s', series),
  'Sol',
  series::numeric / 10,
  series::numeric / 20,
  8,
  series::numeric / 4,
  series,
  format('Eixo %s', series),
  false,
  format('Observacao %s', series),
  format('Informacao %s', series),
  format('Obra %s', lpad(series::text, 3, '0')),
  format('Cidade %s', lpad(series::text, 3, '0'))
from generate_series(1, 73) as series;

insert into public.diarios (data_registro, equipe, clima, observacoes, obra, cidade)
values (date '2026-03-08', 'Equipe Cacau', 'Nublado', 'Pendente de conciliacao', 'Cacau Park', 'Itu - SP');

create table public.test_diarios_antes as
select id, data_registro, equipe, clima, munk_hrs, guindaste_hrs,
  horas_trabalhadas, m3_montado, qtd_bisnagas_pu, eixos_montados,
  encunhamento_pilares, observacoes, informacoes_adicionais, obra, cidade
from public.diarios;

-- Synthetic identities used only by supabase/tests/rls.sql.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@local.test', 'not-used', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'colaborador@local.test', 'not-used', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'sem-acesso@local.test', 'not-used', now(), '{}'::jsonb, '{}'::jsonb, now(), now());
end $$;
