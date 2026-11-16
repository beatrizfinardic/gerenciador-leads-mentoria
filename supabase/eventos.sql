-- Calendário de cursos e palestras. Rodar DEPOIS de auth_rls.sql (usa equipe_autorizada()).

create table if not exists eventos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('Palestra', 'Curso')),
  tema text not null,
  local_cidade text,
  organizador text,
  contato text,
  data date not null,
  tempo text,
  created_at timestamptz not null default now()
);

alter table eventos add column if not exists contato text;

alter table eventos enable row level security;

drop policy if exists "eventos_equipe" on eventos;
create policy "eventos_equipe" on eventos
  for all to authenticated
  using (public.equipe_autorizada())
  with check (public.equipe_autorizada());

revoke all on eventos from anon;
grant select, insert, update, delete on eventos to authenticated;
