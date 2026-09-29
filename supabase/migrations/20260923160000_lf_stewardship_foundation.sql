-- L&F Stewardship: nonprofit fund-accounting foundation
create extension if not exists pgcrypto;

create table if not exists public.finance_funds (
 id uuid primary key default gen_random_uuid(), name text not null, code text not null unique,
 restriction_type text not null default 'without_donor_restrictions' check (restriction_type in ('without_donor_restrictions','donor_restricted')),
 purpose text, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.finance_accounts (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 account_type text not null check (account_type in ('asset','liability','net_asset','revenue','expense')),
 normal_balance text not null check (normal_balance in ('debit','credit')), is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.finance_journal_entries (
 id uuid primary key default gen_random_uuid(), entry_date date not null default current_date, memo text,
 status text not null default 'draft' check (status in ('draft','posted','reversed')),
 source_type text not null default 'manual', source_id uuid, reversal_of uuid references public.finance_journal_entries(id),
 created_by uuid references auth.users(id), posted_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.finance_journal_lines (
 id uuid primary key default gen_random_uuid(), journal_entry_id uuid not null references public.finance_journal_entries(id) on delete restrict,
 account_id uuid not null references public.finance_accounts(id), fund_id uuid references public.finance_funds(id),
 description text, debit numeric(14,2) not null default 0 check (debit>=0), credit numeric(14,2) not null default 0 check (credit>=0),
 created_at timestamptz not null default now(), check ((debit>0 and credit=0) or (credit>0 and debit=0))
);
create table if not exists public.finance_donors (
 id uuid primary key default gen_random_uuid(), profile_id uuid references public.profiles(id), display_name text not null,
 email text, anonymous boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.finance_donations (
 id uuid primary key default gen_random_uuid(), donor_id uuid references public.finance_donors(id), fund_id uuid references public.finance_funds(id),
 amount numeric(14,2) not null check(amount>0), received_at timestamptz not null default now(), payment_method text,
 external_reference text, journal_entry_id uuid references public.finance_journal_entries(id), receipt_number text unique, created_at timestamptz not null default now()
);
create table if not exists public.finance_vendors (
 id uuid primary key default gen_random_uuid(), name text not null, email text, phone text, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.finance_expenses (
 id uuid primary key default gen_random_uuid(), vendor_id uuid references public.finance_vendors(id), fund_id uuid references public.finance_funds(id),
 amount numeric(14,2) not null check(amount>0), expense_date date not null default current_date, description text not null,
 status text not null default 'draft' check(status in ('draft','submitted','approved','paid','void')),
 journal_entry_id uuid references public.finance_journal_entries(id), created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.finance_budgets (
 id uuid primary key default gen_random_uuid(), name text not null, fiscal_year int not null, fund_id uuid references public.finance_funds(id),
 status text not null default 'draft' check(status in ('draft','approved','closed')), created_at timestamptz not null default now()
);
create table if not exists public.finance_budget_items (
 id uuid primary key default gen_random_uuid(), budget_id uuid not null references public.finance_budgets(id) on delete cascade,
 account_id uuid not null references public.finance_accounts(id), amount numeric(14,2) not null default 0, notes text
);
create table if not exists public.finance_reimbursements (
 id uuid primary key default gen_random_uuid(), requester_id uuid not null references auth.users(id), fund_id uuid references public.finance_funds(id),
 amount numeric(14,2) not null check(amount>0), description text not null, status text not null default 'submitted'
 check(status in ('submitted','approved','rejected','paid')), approved_by uuid references auth.users(id), approved_at timestamptz, paid_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.finance_audit_log (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null,
 entity_type text not null, entity_id text, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

insert into public.finance_funds(name,code,restriction_type,purpose) values
 ('General Fund','GENERAL','without_donor_restrictions','General ministry operations'),
 ('Cooking With Christ','CWC','without_donor_restrictions','Cooking With Christ ministry activity'),
 ('Outreach','OUTREACH','without_donor_restrictions','Community outreach'),
 ('Emmaus','EMMAUS','without_donor_restrictions','Bible study and discipleship platform'),
 ('Benevolence','BENEVOLENCE','without_donor_restrictions','Approved benevolence assistance')
on conflict(code) do nothing;

insert into public.finance_accounts(code,name,account_type,normal_balance) values
 ('1000','Checking','asset','debit'),('1010','Savings','asset','debit'),('2000','Accounts Payable','liability','credit'),
 ('3000','Net Assets Without Donor Restrictions','net_asset','credit'),('3100','Net Assets With Donor Restrictions','net_asset','credit'),
 ('4000','Contributions','revenue','credit'),('5000','Ministry Program Expense','expense','debit'),('5100','Operations Expense','expense','debit')
on conflict(code) do nothing;

do $$ declare t text; begin
 foreach t in array array['finance_funds','finance_accounts','finance_journal_entries','finance_journal_lines','finance_donors','finance_donations','finance_vendors','finance_expenses','finance_budgets','finance_budget_items','finance_reimbursements','finance_audit_log']
 loop execute format('alter table public.%I enable row level security',t);
 execute format('create policy "finance admin read %1$s" on public.%1$I for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role=''admin''))',t);
 end loop;
end $$;
