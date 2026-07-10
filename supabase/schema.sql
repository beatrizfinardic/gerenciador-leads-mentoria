-- As tabelas leads e daily_tracking já existiam (criadas pela interface do Supabase)
-- com nomes de coluna um pouco diferentes (created_at, agendamentos_conseguidos).
-- Este script só adiciona o que falta, sem apagar nada.

alter table leads add column if not exists status_changed_at timestamptz not null default now();
alter table leads add column if not exists pagamento_forma text;
alter table leads add column if not exists pagamento_parcelas int;

alter table daily_tracking add column if not exists leads_abordados int not null default 0;
alter table daily_tracking add column if not exists agendamentos_conseguidos int not null default 0;

alter table leads enable row level security;
alter table daily_tracking enable row level security;

drop policy if exists "leads_anon_all" on leads;
create policy "leads_anon_all" on leads for all to anon using (true) with check (true);

drop policy if exists "daily_tracking_anon_all" on daily_tracking;
create policy "daily_tracking_anon_all" on daily_tracking for all to anon using (true) with check (true);

alter publication supabase_realtime add table if not exists leads;
alter publication supabase_realtime add table if not exists daily_tracking;
