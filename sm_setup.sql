-- كاشير السوبر ماركت: شغّل الملف ده مرة واحدة في Supabase (SQL Editor ثم Run).
-- بيعمل جدول واحد لبيانات السوبر ماركت بس، ومش بيلمس جداول خير بلدنا.

create table if not exists public.sm_records (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('product','sale','pinv','settings')),
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, kind, id)
);

alter table public.sm_records enable row level security;

drop policy if exists "sm_records_own" on public.sm_records;
create policy "sm_records_own" on public.sm_records
  for all to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

grant select, insert, update, delete on public.sm_records to authenticated;
