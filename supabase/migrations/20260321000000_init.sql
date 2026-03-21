-- districts table
CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_np VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL
);

-- categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_np VARCHAR(100),
  icon VARCHAR(50),
  type VARCHAR(50) NOT NULL CHECK (type IN ('product', 'service', 'job', 'event')),
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name VARCHAR(200),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'business', 'admin')),
  district_id INTEGER REFERENCES districts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- businesses table
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  tagline VARCHAR(300),
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category_id UUID REFERENCES categories(id),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(200),
  website VARCHAR(300),
  facebook VARCHAR(300),
  instagram VARCHAR(300),
  district_id INTEGER REFERENCES districts(id),
  city VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  hours JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  compare_price DECIMAL(12,2),
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  allows_cod BOOLEAN DEFAULT TRUE,
  allows_esewa BOOLEAN DEFAULT TRUE,
  allows_khalti BOOLEAN DEFAULT TRUE,
  allows_store_pickup BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'out_of_stock')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- offers table
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  banner_url TEXT,
  original_price DECIMAL(12,2) NOT NULL,
  offer_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2),
  max_quantity INTEGER,
  grabbed_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  description TEXT,
  banner_url TEXT,
  event_type VARCHAR(50),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  venue_name VARCHAR(300),
  venue_address TEXT,
  district_id INTEGER REFERENCES districts(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_online BOOLEAN DEFAULT FALSE,
  online_link TEXT,
  is_free BOOLEAN DEFAULT TRUE,
  price DECIMAL(12,2) DEFAULT 0,
  total_seats INTEGER,
  booked_seats INTEGER DEFAULT 0,
  registration_deadline TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'ended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- event_bookings table
CREATE TABLE event_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  attendee_name VARCHAR(200) NOT NULL,
  attendee_email VARCHAR(200),
  attendee_phone VARCHAR(20) NOT NULL,
  seats INTEGER DEFAULT 1,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(20) CHECK (payment_method IN ('esewa', 'khalti', 'free', 'cod')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  ticket_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- jobs table
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  category_id UUID REFERENCES categories(id),
  job_type VARCHAR(30) CHECK (job_type IN ('full-time', 'part-time', 'freelance', 'contract', 'internship')),
  location_type VARCHAR(20) CHECK (location_type IN ('on-site', 'remote', 'hybrid')),
  district_id INTEGER REFERENCES districts(id),
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  show_salary BOOLEAN DEFAULT FALSE,
  experience_level VARCHAR(30) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  deadline TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- job_applications table
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) NOT NULL,
  applicant_id UUID REFERENCES profiles(id),
  applicant_name VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(200) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  cv_url TEXT NOT NULL,
  cover_letter TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id),
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(200),
  delivery_address TEXT,
  district_id INTEGER REFERENCES districts(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  delivery_fee DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('esewa', 'khalti', 'cod', 'store_pickup')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status VARCHAR(30) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  content TEXT,
  owner_reply TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- saved_items table
CREATE TABLE saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id),
  business_id UUID REFERENCES businesses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone can read active businesses" ON businesses FOR SELECT USING (is_active = true);
CREATE POLICY "owners can update their own businesses" ON businesses FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone can read active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "business owners can manage their own products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = products.business_id AND businesses.owner_id = auth.uid())
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone can read active offers" ON offers FOR SELECT USING (status = 'active');
CREATE POLICY "business owners can manage their own offers" ON offers FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = offers.business_id AND businesses.owner_id = auth.uid())
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone can read events" ON events FOR SELECT USING (true);
CREATE POLICY "organizers can manage their own events" ON events FOR ALL USING (auth.uid() = organizer_id);

ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see their own bookings" ON event_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event organizers see all for their events" ON event_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_bookings.event_id AND events.organizer_id = auth.uid())
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone can read active jobs" ON jobs FOR SELECT USING (status = 'active');
CREATE POLICY "business owners manage their own jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = jobs.business_id AND businesses.owner_id = auth.uid())
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applicants see their own" ON job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "business owners see applications for their jobs" ON job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = job_applications.business_id AND businesses.owner_id = auth.uid())
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers see their own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "business owners see orders for their business" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = orders.business_id AND businesses.owner_id = auth.uid())
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "owners can reply to reviews" ON reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.owner_id = auth.uid())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see only their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see only their own saved items" ON saved_items FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- SEED DATA
-- ==========================================

-- All 77 Districts
INSERT INTO districts (name_en, name_np, province) VALUES
('Taplejung', 'ताप्लेजुङ', 'Koshi'), ('Panchthar', 'पाँचथर', 'Koshi'), ('Ilam', 'इलाम', 'Koshi'), ('Jhapa', 'झापा', 'Koshi'), ('Morang', 'मोरङ', 'Koshi'), ('Sunsari', 'सुनसरी', 'Koshi'), ('Dhankuta', 'धनकुटा', 'Koshi'), ('Tehrathum', 'तेह्रथुम', 'Koshi'), ('Sankhuwasabha', 'सङ्खुवासभा', 'Koshi'), ('Bhojpur', 'भोजपुर', 'Koshi'), ('Solukhumbu', 'सोलुखुम्बु', 'Koshi'), ('Okhaldhunga', 'ओखलढुङ्गा', 'Koshi'), ('Khotang', 'खोटाङ', 'Koshi'), ('Udayapur', 'उदयपुर', 'Koshi'),
('Saptari', 'सप्तरी', 'Madhesh'), ('Siraha', 'सिराहा', 'Madhesh'), ('Dhanusha', 'धनुषा', 'Madhesh'), ('Mahottari', 'महोत्तरी', 'Madhesh'), ('Sarlahi', 'सर्लाही', 'Madhesh'), ('Rautahat', 'रौतहट', 'Madhesh'), ('Bara', 'बारा', 'Madhesh'), ('Parsa', 'पर्सा', 'Madhesh'),
('Dolakha', 'दोलखा', 'Bagmati'), ('Sindhupalchok', 'सिन्धुपाल्चोक', 'Bagmati'), ('Rasuwa', 'रसुवा', 'Bagmati'), ('Dhading', 'धादिङ', 'Bagmati'), ('Nuwakot', 'नुवाकोट', 'Bagmati'), ('Kathmandu', 'काठमाडौं', 'Bagmati'), ('Bhaktapur', 'भक्तपुर', 'Bagmati'), ('Lalitpur', 'ललितपुर', 'Bagmati'), ('Kavrepalanchok', 'काभ्रेपलाञ्चोक', 'Bagmati'), ('Ramechhap', 'रामेछाप', 'Bagmati'), ('Sindhuli', 'सिन्धुली', 'Bagmati'), ('Makwanpur', 'मकवानपुर', 'Bagmati'), ('Chitwan', 'चितवन', 'Bagmati'),
('Gorkha', 'गोरखा', 'Gandaki'), ('Manang', 'मनाङ', 'Gandaki'), ('Mustang', 'मुस्ताङ', 'Gandaki'), ('Myagdi', 'म्याग्दी', 'Gandaki'), ('Kaski', 'कास्की', 'Gandaki'), ('Lamjung', 'लमजुङ', 'Gandaki'), ('Tanahun', 'तनहुँ', 'Gandaki'), ('Nawalpur', 'नवलपुर', 'Gandaki'), ('Syangja', 'स्याङ्जा', 'Gandaki'), ('Parbat', 'पर्वत', 'Gandaki'), ('Baglung', 'बागलुङ', 'Gandaki'),
('Rukum East', 'रुकुम पूर्व', 'Lumbini'), ('Rolpa', 'रोल्पा', 'Lumbini'), ('Pyuthan', 'प्युठान', 'Lumbini'), ('Gulmi', 'गुल्मी', 'Lumbini'), ('Arghakhanchi', 'अर्घाखाँची', 'Lumbini'), ('Palpa', 'पाल्पा', 'Lumbini'), ('Rupandehi', 'रुपन्देही', 'Lumbini'), ('Kapilvastu', 'कपिलवस्तु', 'Lumbini'), ('Dang', 'दाङ', 'Lumbini'), ('Banke', 'बाँके', 'Lumbini'), ('Bardiya', 'बर्दिया', 'Lumbini'), ('Parasi', 'परासी', 'Lumbini'),
('Dolpa', 'डोल्पा', 'Karnali'), ('Mugu', 'मुगु', 'Karnali'), ('Humla', 'हुम्ला', 'Karnali'), ('Jumla', 'जुम्ला', 'Karnali'), ('Kalikot', 'कालिकोट', 'Karnali'), ('Dailekh', 'दैलेख', 'Karnali'), ('Jajarkot', 'जाजरकोट', 'Karnali'), ('Rukum West', 'रुकुम पश्चिम', 'Karnali'), ('Salyan', 'सल्यान', 'Karnali'), ('Surkhet', 'सुर्खेत', 'Karnali'),
('Bajura', 'बाजुरा', 'Sudurpashchim'), ('Bajhang', 'बझाङ', 'Sudurpashchim'), ('Darchula', 'दार्चुला', 'Sudurpashchim'), ('Baitadi', 'बैतडी', 'Sudurpashchim'), ('Dadeldhura', 'डडेल्धुरा', 'Sudurpashchim'), ('Doti', 'डोटी', 'Sudurpashchim'), ('Achham', 'अछाम', 'Sudurpashchim'), ('Kailali', 'कैलाली', 'Sudurpashchim'), ('Kanchanpur', 'कञ्चनपुर', 'Sudurpashchim');

-- Categories Generation (15 product, 8 job, 5 event)
INSERT INTO categories (name_en, type) VALUES
('Electronics', 'product'), ('Clothing', 'product'), ('Food & Beverages', 'product'), ('Beauty', 'product'), ('Home & Garden', 'product'), ('Automotive', 'product'), ('Education', 'product'), ('Health & Medical', 'product'), ('Agriculture', 'product'), ('Sports', 'product'), ('Books', 'product'), ('Handicraft', 'product'), ('Furniture', 'product'), ('Stationery', 'product'), ('Other', 'product'),
('IT & Technology', 'job'), ('Marketing', 'job'), ('Finance', 'job'), ('Education', 'job'), ('Healthcare', 'job'), ('Construction', 'job'), ('Hospitality', 'job'), ('Other', 'job'),
('Workshop', 'event'), ('Concert', 'event'), ('Festival', 'event'), ('Sports', 'event'), ('Community', 'event');
