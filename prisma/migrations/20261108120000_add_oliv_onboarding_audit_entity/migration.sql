-- Additive, non-destructive: a new audit entity for the Oliv Finance
-- onboarding step. Existing rows and values are untouched.

ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'OLIV_ONBOARDING';
