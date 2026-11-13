export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'CUSTOMER' | 'AMBASSADOR' | 'STUDIO' | 'DELIVERY' | 'ADMIN' | 'SUPER_ADMIN';

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PLACED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_CONFIRMED'
  | 'ASSIGNED_STUDIO'
  | 'ACCEPTED_BY_STUDIO'
  | 'DESIGNING'
  | 'IN_PRODUCTION'
  | 'PRINTING'
  | 'FRAMING'
  | 'QUALITY_CHECK'
  | 'READY_FOR_DELIVERY'
  | 'READY_FOR_PICKUP'
  | 'DELIVERY_ASSIGNED'
  | 'ASSIGNED_DELIVERY'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REPLACEMENT_REQUESTED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'REJECTED_BY_STUDIO';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          image_url: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          image_url?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          image_url?: string | null;
          date_of_birth?: string | null;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          category_name: string;
          name: string;
          slug: string;
          description: string;
          base_price: number;
          original_price: number | null;
          rating: number;
          reviews_count: number;
          badge_tag: string | null;
          images: Json;
          stock: number;
          status: string;
          is_active: boolean;
          variants: Json | null;
          frame_sizes: Json | null;
          frame_colors: Json | null;
          polaroid_sizes: Json | null;
          about_points: Json | null;
          about_title: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          referral_code: string | null;
          referral_discount: number;
          commission_earned: number;
          total_amount: number;
          status: OrderStatus;
          shipping_address: Json;
          delivery_type: string;
          is_surprise_gift: boolean;
          surprise_gift_message: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount: number;
          currency: string;
          status: string;
          created_at: string;
        };
      };
      commissions: {
        Row: {
          id: string;
          order_id: string;
          ambassador_id: string | null;
          referral_code: string;
          amount: number;
          status: string;
          created_at: string;
        };
      };
    };
  };
}
