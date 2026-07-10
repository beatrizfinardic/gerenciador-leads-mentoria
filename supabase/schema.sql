-- Migração incremental: adiciona só o que falta, não apaga nada.

alter table leads add column if not exists status_changed_at timestamptz not null default now();
alter table leads add column if not exists pagamento_forma text;
alter table leads add column if not exists pagamento_parcelas int;
alter table leads add column if not exists agendamento_em timestamptz;
alter table leads add column if not exists perdido_motivo text;
alter table leads add column if not exists perdido_followup text;

alter table daily_tracking add column if not exists leads_abordados int not null default 0;
alter table daily_tracking add column if not exists agendamentos_conseguidos int not null default 0;

alter table leads enable row level security;
alter table daily_tracking enable row level security;

drop policy if exists "leads_anon_all" on leads;
create policy "leads_anon_all" on leads for all to anon using (true) with check (true);

drop policy if exists "daily_tracking_anon_all" on daily_tracking;
create policy "daily_tracking_anon_all" on daily_tracking for all to anon using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table leads;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table daily_tracking;
exception when duplicate_object then null;
end $$;
