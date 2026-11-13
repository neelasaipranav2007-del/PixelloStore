-- ==============================================================================
-- PIXELLOSTORE SUPABASE DATABASE MIGRATION: 002_ROW_LEVEL_SECURITY (RLS)
-- Comprehensive RLS Policies for Customer, Admin, Ambassador, and Delivery
-- Protects IDOR, customer uploaded photos, internal costs, and payment integrity
-- ==============================================================================

-- 1. Helper Functions with Secure Search Path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Enable RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hamper_box_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hamper_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- 3. Profiles Policies
CREATE POLICY "Profiles are viewable by owner or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 4. User Roles Policies
CREATE POLICY "Admins manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin());

CREATE POLICY "Users view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- 5. Customer Addresses Policies
CREATE POLICY "Customers view own addresses"
ON public.customer_addresses FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Customers manage own addresses"
ON public.customer_addresses FOR ALL
USING (auth.uid() = user_id);

-- 6. Product Categories & Products (Public read for active items, Admin write)
CREATE POLICY "Public read categories"
ON public.product_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins manage categories"
ON public.product_categories FOR ALL
USING (public.is_admin());

CREATE POLICY "Public read active products"
ON public.products FOR SELECT
USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage products"
ON public.products FOR ALL
USING (public.is_admin());

-- 7. Coupons Policies
CREATE POLICY "Public read active coupons"
ON public.coupons FOR SELECT
USING (status = 'Active' OR public.is_admin());

CREATE POLICY "Admins manage coupons"
ON public.coupons FOR ALL
USING (public.is_admin());

-- 8. Hampers Policies
CREATE POLICY "Public read hamper box types"
ON public.hamper_box_types FOR SELECT
USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Users view own hampers"
ON public.hampers FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users manage own hampers"
ON public.hampers FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users view own hamper items"
ON public.hamper_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hampers
    WHERE hampers.id = hamper_items.hamper_id AND (hampers.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users manage own hamper items"
ON public.hamper_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.hampers
    WHERE hampers.id = hamper_items.hamper_id AND hampers.user_id = auth.uid()
  )
);

-- 9. Carts & Wishlist Policies
CREATE POLICY "Users manage own cart"
ON public.carts FOR ALL
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users manage own cart items"
ON public.cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users manage own wishlist"
ON public.product_wishlist FOR ALL
USING (auth.uid() = user_id OR public.is_admin());

-- 10. Orders Policies (Strict Customer Ownership & Admin Control)
CREATE POLICY "Customers view own orders"
ON public.orders FOR SELECT
USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authenticated users can create orders"
ON public.orders FOR INSERT
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins update orders"
ON public.orders FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Order items viewable by order owner or admin"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Order status history viewable by order owner or admin"
ON public.order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status_history.order_id AND (orders.customer_id = auth.uid() OR public.is_admin())
  )
);

-- 11. Payments Policies (Zero Client Direct Insertion/Update)
CREATE POLICY "Users view payments for their own orders"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id AND (orders.customer_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Admins view all payments"
ON public.payments FOR ALL
USING (public.is_admin());

-- 12. Ambassador Network Policies
CREATE POLICY "Ambassadors view own profile"
ON public.ambassador_profiles FOR SELECT
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Ambassadors update own profile details"
ON public.ambassador_profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Ambassadors view own commissions"
ON public.commissions FOR SELECT
USING (ambassador_id = auth.uid() OR public.is_admin());

CREATE POLICY "Ambassadors manage own payouts"
ON public.ambassador_payouts FOR ALL
USING (ambassador_id = auth.uid() OR public.is_admin());

-- 13. Delivery Assignments Policies
CREATE POLICY "Delivery drivers view own profile"
ON public.delivery_profiles FOR ALL
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Delivery drivers view assigned tasks"
ON public.delivery_assignments FOR SELECT
USING (delivery_profile_id = auth.uid() OR public.is_admin());

CREATE POLICY "Delivery drivers update assigned task status"
ON public.delivery_assignments FOR UPDATE
USING (delivery_profile_id = auth.uid() OR public.is_admin());

-- 14. Notifications & Audit Logs Policies
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins manage system settings"
ON public.system_settings FOR ALL
USING (public.is_admin());

CREATE POLICY "Public read non-sensitive system settings"
ON public.system_settings FOR SELECT
USING (key IN ('homepage_stats', 'spotlight_banners', 'delivery_config'));

CREATE POLICY "Users view own terms acceptances"
ON public.terms_acceptances FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());
