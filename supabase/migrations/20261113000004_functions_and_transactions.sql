-- ==============================================================================
-- PIXELLOSTORE SUPABASE DATABASE MIGRATION: 004_FUNCTIONS_AND_TRANSACTIONS
-- Atomic Transactions: Order Confirmation, Inventory Reservation, Commissions,
-- Auth User Trigger, and pgvector Visual Search
-- ==============================================================================

-- 1. Automatic Profile Creation Trigger on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, image_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default Role: CUSTOMER
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'CUSTOMER')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to auth.users if not already attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Atomic Order Confirmation & Inventory Reservation
CREATE OR REPLACE FUNCTION public.confirm_order_and_reserve_inventory(
  p_order_id UUID,
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT,
  p_signature TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_ambassador RECORD;
  v_commission_amount NUMERIC;
BEGIN
  -- Fetch order with row lock to prevent race conditions
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order.status = 'PAYMENT_CONFIRMED' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Order already confirmed');
  END IF;

  -- 1. Insert Payment Record
  INSERT INTO public.payments (
    order_id,
    payment_method,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    status
  ) VALUES (
    p_order_id,
    'RAZORPAY',
    p_razorpay_order_id,
    p_razorpay_payment_id,
    p_signature,
    p_amount,
    'SUCCESS'
  );

  -- 2. Update Order Status
  UPDATE public.orders
  SET status = 'PAYMENT_CONFIRMED',
      updated_at = NOW()
  WHERE id = p_order_id;

  -- 3. Log Status History
  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (p_order_id, 'PAYMENT_CONFIRMED', 'Payment verified and confirmed via Razorpay');

  -- 4. Safely Decrement Product Stock
  FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = GREATEST(0, stock - v_item.quantity),
          updated_at = NOW()
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- 5. Calculate and Award Ambassador Commission if Referral Code is attached
  IF v_order.referral_code IS NOT NULL AND v_order.referral_code <> '' THEN
    SELECT * INTO v_ambassador 
    FROM public.ambassador_profiles 
    WHERE referral_code = v_order.referral_code AND status = 'APPROVED';

    IF FOUND THEN
      v_commission_amount := ROUND((v_order.total_amount * v_ambassador.commission_rate), 2);

      INSERT INTO public.commissions (
        order_id,
        ambassador_id,
        referral_code,
        amount,
        status
      ) VALUES (
        p_order_id,
        v_ambassador.id,
        v_order.referral_code,
        v_commission_amount,
        'ELIGIBLE'
      );

      UPDATE public.ambassador_profiles
      SET balance = balance + v_commission_amount,
          total_earned = total_earned + v_commission_amount,
          updated_at = NOW()
      WHERE id = v_ambassador.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', p_order_id,
    'status', 'PAYMENT_CONFIRMED'
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Visual Search pgvector Cosine Distance Query Function
CREATE OR REPLACE FUNCTION public.match_products_by_embedding(
  query_embedding vector(512),
  match_threshold float DEFAULT 0.60,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  base_price NUMERIC,
  images JSONB,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    products.id,
    products.name,
    products.slug,
    products.description,
    products.base_price,
    products.images,
    1 - (products.image_embedding <=> query_embedding) AS similarity
  FROM public.products
  WHERE products.is_active = TRUE 
    AND products.image_embedding IS NOT NULL
    AND 1 - (products.image_embedding <=> query_embedding) > match_threshold
  ORDER BY products.image_embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
