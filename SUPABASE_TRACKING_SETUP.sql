-- EXCHANGE DZ: Public order tracking by unguessable reference only.
-- Returns no email, customer identifier, proof path, or payment image.
CREATE OR REPLACE FUNCTION public.get_order_status(p_reference text)
RETURNS TABLE (
  reference text,
  operation text,
  amount_usdt numeric,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.reference, o.operation, o.amount_usdt, o.status, o.created_at
  FROM public.orders AS o
  WHERE upper(o.reference) = upper(trim(p_reference))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO anon, authenticated;
