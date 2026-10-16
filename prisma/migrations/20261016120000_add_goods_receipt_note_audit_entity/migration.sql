-- Add the receiving record to the audited entity vocabulary without changing prior rows.
ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'GOODS_RECEIPT_NOTE';
