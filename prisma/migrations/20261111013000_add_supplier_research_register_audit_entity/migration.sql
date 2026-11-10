-- Additive, non-destructive: audit entity for the admin-only
-- supplier research register import. Existing rows and values are untouched.

ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'SUPPLIER_RESEARCH_REGISTER';
