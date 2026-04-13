-- Add range_header column to download_history table
-- Stores the original Range request header for breakpoint resume tracking

ALTER TABLE download_history ADD COLUMN range_header TEXT;
