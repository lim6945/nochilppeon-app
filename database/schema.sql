-- 놓칠뻔 서비스 — 누적 이용자 수 카운터 전용 스키마
-- Supabase SQL Editor에서 1회 실행하세요.
-- 개인정보나 사용자 입력값은 절대 저장하지 않고, 순수 카운트 1개만 다룹니다.

create table if not exists public.usage_counter (
  id smallint primary key default 1,
  count bigint not null default 0,
  constraint usage_counter_singleton check (id = 1)
);

insert into public.usage_counter (id, count)
values (1, 0)
on conflict (id) do nothing;

alter table public.usage_counter enable row level security;

-- 클라이언트(publishable/anon key)는 합계 조회만 허용하고, 증가는 아래 RPC를 통해서만 가능
create policy "usage_counter_select" on public.usage_counter
  for select using (true);

create or replace function public.increment_usage_counter()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  update public.usage_counter
  set count = count + 1
  where id = 1
  returning count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_usage_counter() to anon, authenticated;
