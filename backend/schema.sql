-- Run this in the Supabase SQL Editor. Safe to rerun for the known schema.

CREATE TABLE IF NOT EXISTS public.test_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donation_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  donor_name TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.donation_requests
  ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donation_requests_user_id
  ON public.donation_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_donation_requests_created_at
  ON public.donation_requests(created_at DESC);
