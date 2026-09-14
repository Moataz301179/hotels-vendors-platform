-- AlterEnum: Expand TripStatus and StopStatus for full logistics lifecycle
-- Run on: 2026-07-14

-- Add new TripStatus values (PostgreSQL requires ALTER TYPE for each value)
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'PICKED_UP';
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'ARRIVED';
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'DELAYED';
ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS 'RETURNING';

-- Add new StopStatus value
ALTER TYPE "StopStatus" ADD VALUE IF NOT EXISTS 'POD_CAPTURED';
