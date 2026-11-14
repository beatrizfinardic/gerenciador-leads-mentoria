-- Rodar SOMENTE depois de:
--   1) criar os 3 usuários em Authentication > Users (Igor, Gabi, Djavan)
--   2) cada um ter feito o login com o código do app autenticador (MFA)
-- Antes disso, esta migração tranca o sistema para todo mundo.

-- Lista de e-mails autorizados (editar antes de rodar)
create or replace function public.equipe_autorizada()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') in (
    'beatrizfinardic@gmail.com'
    -- para liberar outra pessoa depois, acrescente o e-mail aqui, ex.: 'gabiiivargas1@gmail.com'
  )
  and (auth.jwt() ->> 'aal') = 'aal2';
$$;

drop policy if exists "leads_anon_all" on leads;
drop policy if exists "daily_tracking_anon_all" on daily_tracking;

create policy "leads_equipe_mfa" on leads
  for all to authenticated
  using (public.equipe_autorizada())
  with check (public.equipe_autorizada());

create policy "daily_tracking_equipe_mfa" on daily_tracking
  for all to authenticated
  using (public.equipe_autorizada())
  with check (public.equipe_autorizada());

revoke all on leads from anon;
revoke all on daily_tracking from anon;
