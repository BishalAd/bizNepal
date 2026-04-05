-- Create increment_offer_grab function to safely record an offer claim
CREATE OR REPLACE FUNCTION increment_offer_grab(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE offers
  SET grabbed_count = COALESCE(grabbed_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
