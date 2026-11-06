export type EventType =
  | "festival"
  | "private_catering"
  | "farmers_market"
  | "street_lot"
  | "corporate"
  | "brewery_bar"
  | "sporting_event"
  | "other";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  festival: "Festival",
  private_catering: "Private Catering",
  farmers_market: "Farmers Market",
  street_lot: "Street / Lot",
  corporate: "Corporate",
  brewery_bar: "Brewery / Bar",
  sporting_event: "Sporting Event",
  other: "Other",
};

export type EventStatus = "planned" | "completed" | "cancelled";

export type PaymentMethod = "cash" | "card" | "other";

export interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string | null;
  end_date: string | null;
  event_type: EventType;
  location: string | null;
  expected_attendance: number | null;
  actual_attendance: number | null;
  weather_condition: string | null;
  temperature_high: number | null;
  booth_fee: number | null;
  booth_fee_percent: number | null;
  status: EventStatus;
  notes: string | null;
  is_public: boolean;
  contact_id: string | null;
  created_at: string;
}

export interface EventDay {
  id: string;
  event_id: string;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  price: number;
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
}

export type InventoryCategory = "food" | "packaging" | "other";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit_of_measure: string;
  current_unit_cost: number | null;
  par_level: number | null;
  reorder_point: number | null;
  preferred_supplier: string | null;
  is_prepared: boolean;
  yield_quantity: number | null;
  yield_unit_of_measure: string | null;
  created_at: string;
}

export interface InventoryItemComponent {
  id: string;
  parent_item_id: string;
  component_item_id: string;
  quantity: number;
}

export interface RecipeComponent {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity_per_unit: number;
}

export type InventoryTransactionType =
  | "purchase"
  | "usage"
  | "waste"
  | "adjustment"
  | "prep_stock";

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  event_id: string | null;
  sales_transaction_id: string | null;
  transaction_type: InventoryTransactionType;
  quantity: number;
  unit_cost: number | null;
  transaction_date: string;
  notes: string | null;
  created_at: string;
}

export interface InventoryCount {
  id: string;
  inventory_item_id: string;
  count_date: string;
  counted_quantity: number;
  notes: string | null;
  created_at: string;
}

export type ExpenseCategory =
  | "fuel"
  | "propane"
  | "vehicle_maintenance"
  | "commissary_rent"
  | "labor_wages"
  | "permits_fees"
  | "packaging_supplies"
  | "insurance"
  | "marketing"
  | "other";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: "Fuel",
  propane: "Propane",
  vehicle_maintenance: "Vehicle Maintenance",
  commissary_rent: "Commissary Rent",
  labor_wages: "Labor / Wages",
  permits_fees: "Permits & Fees",
  packaging_supplies: "Packaging & Supplies",
  insurance: "Insurance",
  marketing: "Marketing",
  other: "Other",
};

export interface Expense {
  id: string;
  event_id: string | null;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  mileage: number | null;
  gallons: number | null;
  notes: string | null;
  created_at: string;
}

export interface SalesTransaction {
  id: string;
  event_id: string;
  transaction_time: string;
  payment_method: PaymentMethod;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface SalesLineItem {
  id: string;
  transaction_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_comp: boolean;
}

export type ContactType =
  | "venue"
  | "event_organizer"
  | "vendor_supplier"
  | "food_truck"
  | "press_media"
  | "other";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  venue: "Venue",
  event_organizer: "Event Organizer",
  vendor_supplier: "Vendor / Supplier",
  food_truck: "Food Truck",
  press_media: "Press / Media",
  other: "Other",
};

export interface Contact {
  id: string;
  name: string;
  business_name: string | null;
  contact_type: ContactType;
  email: string | null;
  phone: string | null;
  social_handle: string | null;
  notes: string | null;
  created_at: string;
}

export interface EmailAccount {
  id: string;
  email_address: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  connected_at: string;
}

export interface EmailMessage {
  id: string;
  account_id: string;
  gmail_message_id: string;
  thread_id: string | null;
  from_name: string | null;
  from_address: string | null;
  subject: string | null;
  snippet: string | null;
  body_text: string | null;
  received_at: string | null;
  is_read: boolean;
  created_at: string;
}

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "twitter_x" | "other";

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter_x: "Twitter / X",
  other: "Other",
};

export type SocialPostType = "photo" | "video" | "story" | "reel" | "other";

export const SOCIAL_POST_TYPE_LABELS: Record<SocialPostType, string> = {
  photo: "Photo",
  video: "Video",
  story: "Story",
  reel: "Reel",
  other: "Other",
};

export type SocialStrategyStatus = "idea" | "scheduled" | "posted";

export const SOCIAL_STRATEGY_STATUS_LABELS: Record<SocialStrategyStatus, string> = {
  idea: "Idea",
  scheduled: "Scheduled",
  posted: "Posted",
};

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  post_date: string;
  post_type: SocialPostType;
  caption_summary: string | null;
  permalink: string | null;
  linked_event_id: string | null;
  created_at: string;
}

export interface SocialMetric {
  id: string;
  post_id: string;
  recorded_date: string;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  views: number | null;
  reach: number | null;
  follower_count_snapshot: number | null;
  created_at: string;
}

export interface SocialStrategyPlan {
  id: string;
  planned_date: string;
  platform: SocialPlatform;
  content_idea: string;
  linked_event_id: string | null;
  status: SocialStrategyStatus;
  notes: string | null;
  created_at: string;
}

export interface CalendarTask {
  id: string;
  title: string;
  due_date: string;
  due_time: string | null;
  contact_id: string | null;
  notes: string | null;
  is_done: boolean;
  created_at: string;
}

export interface TodoCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface TodoItem {
  id: string;
  category_id: string;
  title: string;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
}

export type InquiryType = "catering" | "event_booking" | "general";

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  catering: "Catering",
  event_booking: "Event Booking",
  general: "General",
};

export type InquiryStatus = "new" | "contacted" | "booked" | "declined";

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  declined: "Declined",
};

export interface Inquiry {
  id: string;
  inquiry_type: InquiryType;
  name: string;
  email: string | null;
  phone: string | null;
  event_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  event_location: string | null;
  guest_count: number | null;
  message: string | null;
  status: InquiryStatus;
  created_at: string;
}
