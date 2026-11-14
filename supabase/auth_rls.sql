-- Rodar no SQL Editor. Só deixa ler e alterar dados quem estiver logado
-- e com e-mail na lista abaixo. Para liberar outra pessoa, acrescente o e-mail na lista.

create or replace function public.equipe_autorizada()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') in (
    'beatrizfinardic@gmail.com'
    -- para liberar outra pessoa depois, acrescente o e-mail aqui, ex.: 'gabiiivargas1@gmail.com'
  );
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
