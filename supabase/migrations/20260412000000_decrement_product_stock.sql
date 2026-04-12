-- Create a function to decrement product stock during checkout or WhatsApp reservation
CREATE OR REPLACE FUNCTION decrement_product_stock(row_id UUID, qty INT)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - qty
  WHERE id = row_id AND stock_quantity >= qty;
END;
$$ LANGUAGE plpgsql;
