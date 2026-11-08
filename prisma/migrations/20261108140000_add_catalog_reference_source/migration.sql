-- Additive: staged catalog references are distinct from supplier offers.
ALTER TYPE "ProductSource" ADD VALUE IF NOT EXISTS 'CATALOG_REFERENCE';
