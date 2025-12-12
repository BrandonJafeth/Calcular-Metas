-- Create the table for storing daily records
create table daily_records (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table daily_records enable row level security;

-- Create a policy that allows anyone to read/write (for now, since no auth is implemented)
-- In a real app, you'd want to restrict this to authenticated users
create policy "Enable read access for all users" on daily_records for select using (true);
create policy "Enable insert access for all users" on daily_records for insert with check (true);
create policy "Enable update access for all users" on daily_records for update using (true);
