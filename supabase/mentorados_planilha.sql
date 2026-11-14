-- Acompanhamento dos mentorados (importado das planilhas Titulares e Eméritos).
-- Rodar DEPOIS de auth_rls.sql. Só cria a estrutura; os dados entram pelo próprio sistema.

create table if not exists mentorados_planilha (
  id bigint generated always as identity primary key,
  tipo_mentoria text not null,
  nome text not null,
  telefone text,
  email text,
  cpf text,
  rg text,
  data_entrada date,
  data_encerra date,
  renovou boolean,
  reuniao_3m_feita boolean not null default false,
  reuniao_3m_data date,
  reuniao_3m_obs text,
  reuniao_6m_feita boolean not null default false,
  reuniao_6m_data date,
  reuniao_6m_obs text,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table mentorados_planilha enable row level security;

drop policy if exists "mentorados_planilha_equipe" on mentorados_planilha;
create policy "mentorados_planilha_equipe" on mentorados_planilha
  for all to authenticated
  using (public.equipe_autorizada())
  with check (public.equipe_autorizada());

revoke all on mentorados_planilha from anon;
