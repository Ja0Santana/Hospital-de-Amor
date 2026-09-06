CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE system_role_type AS ENUM (
  'PATIENT',
  'DONOR',
  'RECEPTIONIST',
  'MANAGER',
  'AUDITOR'
);

CREATE TYPE blood_type AS ENUM (
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE'
);

CREATE TYPE appointment_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'UNDER_ANALYSIS',
  'RESCHEDULE_PENDING',
  'AWAITING_FOLLOW_UP',
  'COMPLETED',
  'ARCHIVED_PENDING_DOCS'
);

CREATE TYPE appointment_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE attachment_review_status AS ENUM (
  'PENDING',
  'APPROVED',
  'ILLEGIBLE',
  'CORRECTION_REQUIRED'
);

CREATE TYPE waitlist_offer_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE symptom_intensity_level AS ENUM (
  'MILD',
  'MODERATE',
  'SEVERE'
);

CREATE TYPE clinical_record_type AS ENUM (
  'EXAM',
  'REPORT',
  'PRESCRIPTION'
);

CREATE TYPE feedback_resolution_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED'
);

CREATE TYPE pep_sync_status AS ENUM (
  'PENDING',
  'SYNCHRONIZED',
  'FAILED'
);

CREATE TYPE email_delivery_status AS ENUM (
  'QUEUED',
  'SENT',
  'BOUNCED',
  'FAILED'
);

CREATE TYPE hospital_service_type AS ENUM (
  'PREVENTION',
  'TREATMENT',
  'REHABILITATION'
);

CREATE TYPE donation_payment_method AS ENUM (
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BOLETO',
  'CRYPTO'
);

CREATE TYPE donation_status AS ENUM (
  'PENDING',
  'AWAITING_PAYMENT',
  'PROCESSING',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED'
);

CREATE TYPE donation_type AS ENUM (
  'SINGLE',
  'RECURRING'
);

CREATE TYPE subscription_status AS ENUM (
  'ACTIVE',
  'PAUSED',
  'CANCELLED'
);

CREATE TYPE loyalty_tier_level AS ENUM (
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND'
);

CREATE TYPE loyalty_transaction_type AS ENUM (
  'EARNED_FROM_DONATION',
  'REDEEMED_REWARD',
  'EXPIRED',
  'MANUAL_ADJUSTMENT'
);

CREATE TYPE tax_incentive_fund AS ENUM (
  'PRONON',
  'FIA',
  'ELDERLY'
);

CREATE TYPE corporate_proposal_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CONFIRMED'
);

CREATE TYPE representative_permission AS ENUM (
  'ADMIN',
  'VIEWER'
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name system_role_type NOT NULL,
  description VARCHAR(255) NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpf VARCHAR(11) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_attempts_count >= 0),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL,
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_code)
);

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  health_region VARCHAR(100) NOT NULL,
  CONSTRAINT uq_city_name_state UNIQUE (name, state)
);

CREATE TABLE hospital_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  physical_address VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  operating_hours_description VARCHAR(255) NOT NULL,
  latitude_coordinate NUMERIC(10, 8) NOT NULL,
  longitude_coordinate NUMERIC(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospital_unit_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES hospital_units(id) ON DELETE CASCADE,
  service_type hospital_service_type NOT NULL,
  CONSTRAINT uq_unit_service UNIQUE (unit_id, service_type)
);

CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospital_unit_specialties (
  unit_id UUID NOT NULL REFERENCES hospital_units(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (unit_id, specialty_id)
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  default_prep_instructions TEXT NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  room_number VARCHAR(50),
  operational_cost NUMERIC(12, 2) CHECK (operational_cost >= 0),
  requires_encaminhamento BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_limit INTEGER CHECK (maintenance_limit > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_required_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  resource_name VARCHAR(100) NOT NULL
);

CREATE TABLE capacity_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL UNIQUE REFERENCES exams(id) ON DELETE CASCADE,
  daily_limit INTEGER NOT NULL CHECK (daily_limit >= 0),
  weekly_limit INTEGER CHECK (weekly_limit >= 0),
  monthly_limit INTEGER CHECK (monthly_limit >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE temporary_capacity_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  temporary_limit INTEGER NOT NULL CHECK (temporary_limit >= 0),
  justification_reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_exam_target_date UNIQUE (exam_id, target_date)
);

CREATE TABLE patient_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  blood_type blood_type,
  known_allergies TEXT,
  clinical_diagnosis TEXT,
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  photo_url VARCHAR(255),
  referred_by VARCHAR(150),
  last_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_privacy_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  should_notify_by_email BOOLEAN NOT NULL DEFAULT TRUE,
  should_notify_by_sms BOOLEAN NOT NULL DEFAULT TRUE,
  should_notify_by_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
  should_notify_for_nps BOOLEAN NOT NULL DEFAULT TRUE,
  should_receive_newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  should_receive_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_read_booklets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booklet_id VARCHAR(100) NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_patient_booklet UNIQUE (patient_user_id, booklet_id)
);

CREATE TABLE patient_clinical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  title VARCHAR(150) NOT NULL,
  record_type clinical_record_type NOT NULL,
  record_date DATE NOT NULL,
  attachment_file_name VARCHAR(255) NOT NULL,
  attachment_mime_type VARCHAR(100) NOT NULL,
  attachment_size_bytes INTEGER NOT NULL,
  attachment_storage_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE symptom_diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_level VARCHAR(50) NOT NULL,
  general_notes TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE symptom_diary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diary_entry_id UUID NOT NULL REFERENCES symptom_diary_entries(id) ON DELETE CASCADE,
  symptom_name VARCHAR(100) NOT NULL,
  intensity_level symptom_intensity_level NOT NULL
);

CREATE TABLE symptom_diary_body_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diary_entry_id UUID NOT NULL REFERENCES symptom_diary_entries(id) ON DELETE CASCADE,
  body_region_name VARCHAR(100) NOT NULL
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_number VARCHAR(30) NOT NULL UNIQUE,
  patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  priority_level appointment_priority NOT NULL DEFAULT 'LOW',
  is_legal_priority BOOLEAN NOT NULL DEFAULT FALSE,
  clinical_observations TEXT,
  has_lgpd_consent BOOLEAN NOT NULL,
  origin_session_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_drafts (
  patient_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  draft_payload_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  status appointment_status NOT NULL,
  changed_by_staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  change_notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_schedules (
  appointment_id UUID PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
  hospital_unit_id UUID REFERENCES hospital_units(id) ON DELETE RESTRICT,
  scheduled_doctor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_room VARCHAR(50),
  scheduled_date DATE,
  scheduled_time TIME,
  is_presence_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  presence_confirmed_at TIMESTAMPTZ,
  rescheduled_date DATE,
  rescheduled_time TIME,
  reschedule_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_mime_type VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  review_status attachment_review_status NOT NULL DEFAULT 'PENDING',
  reviewed_by_staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_feedback TEXT,
  is_rejected BOOLEAN NOT NULL DEFAULT FALSE,
  superseded_by_attachment_id UUID REFERENCES appointment_attachments(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE waitlist_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  offered_date DATE NOT NULL,
  offered_time TIME NOT NULL,
  offer_expires_at TIMESTAMPTZ NOT NULL,
  status waitlist_offer_status NOT NULL DEFAULT 'PENDING',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  comment_text TEXT,
  origin_session_id VARCHAR(100) NOT NULL,
  origin_ip_address VARCHAR(45) NOT NULL,
  admin_response_text TEXT,
  admin_response_at TIMESTAMPTZ,
  admin_responder_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_status feedback_resolution_status NOT NULL DEFAULT 'PENDING',
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE triage_internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  author_staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note_text TEXT NOT NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  receptionist_staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reception_desk_identifier VARCHAR(50)
);

CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  professional_staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  attendance_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attendance_completed_at TIMESTAMPTZ,
  clinical_summary_text TEXT
);

CREATE TABLE pep_integration_syncs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  sync_status pep_sync_status NOT NULL DEFAULT 'PENDING',
  pep_registry_identifier VARCHAR(100),
  sync_attempts_count INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  last_error_message TEXT
);

CREATE TABLE digital_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  signer_staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  signer_cpf VARCHAR(11) NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature_hash VARCHAR(128) NOT NULL,
  certificate_serial_number VARCHAR(100) NOT NULL
);

CREATE TABLE custom_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority_name VARCHAR(100) NOT NULL UNIQUE,
  description_text VARCHAR(255),
  hex_color_code VARCHAR(7)
);

CREATE TABLE saved_triage_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filter_name VARCHAR(100) NOT NULL,
  filter_criteria_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution_calendar_days (
  target_date DATE PRIMARY KEY,
  day_label VARCHAR(100) NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  operating_hours_override VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transparency_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_title VARCHAR(150) NOT NULL,
  project_description TEXT NOT NULL,
  completed_date DATE NOT NULL,
  total_amount_raised NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_amount_raised >= 0),
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE transparency_monthly_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_month VARCHAR(7) NOT NULL UNIQUE,
  total_income NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_income >= 0),
  total_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_expenses >= 0),
  total_attendances_count INTEGER NOT NULL DEFAULT 0 CHECK (total_attendances_count >= 0),
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transparency_sector_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_balance_id UUID REFERENCES transparency_monthly_balances(id) ON DELETE CASCADE,
  sector_name VARCHAR(100) NOT NULL,
  allocated_amount NUMERIC(14, 2) NOT NULL CHECK (allocated_amount >= 0),
  hex_display_color VARCHAR(7) NOT NULL
);

CREATE TABLE donor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_anonymous_default BOOLEAN NOT NULL DEFAULT FALSE,
  referred_by_donor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recurring_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_project_id UUID REFERENCES transparency_projects(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  card_masked_number VARCHAR(20) NOT NULL,
  next_billing_date DATE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES recurring_subscriptions(id) ON DELETE SET NULL,
  target_project_id UUID REFERENCES transparency_projects(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method donation_payment_method NOT NULL,
  status donation_status NOT NULL DEFAULT 'PENDING',
  donation_type donation_type NOT NULL DEFAULT 'SINGLE',
  transaction_hash VARCHAR(128) NOT NULL,
  gateway_transaction_id VARCHAR(100),
  failure_reason VARCHAR(255),
  tax_receipt_number VARCHAR(100),
  end_to_end_id VARCHAR(100),
  pix_copia_e_cola TEXT,
  pix_expires_at TIMESTAMPTZ,
  boleto_barcode VARCHAR(100),
  boleto_due_date DATE,
  crypto_wallet_address VARCHAR(150),
  crypto_transaction_network VARCHAR(50),
  crypto_amount NUMERIC(18, 8),
  exchange_rate_brl NUMERIC(14, 4),
  quote_expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donor_loyalty_accounts (
  donor_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_points_balance INTEGER NOT NULL DEFAULT 0 CHECK (current_points_balance >= 0),
  lifetime_accumulated_points INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_accumulated_points >= 0),
  loyalty_tier loyalty_tier_level NOT NULL DEFAULT 'BRONZE',
  prestige_level INTEGER NOT NULL DEFAULT 0 CHECK (prestige_level >= 0),
  points_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_badge_catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  minimum_tier_required loyalty_tier_level NOT NULL DEFAULT 'BRONZE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE redeemed_loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  badge_id UUID NOT NULL REFERENCES loyalty_badge_catalogs(id) ON DELETE RESTRICT,
  cost_points_paid INTEGER NOT NULL CHECK (cost_points_paid > 0),
  prestige_at_acquisition INTEGER NOT NULL DEFAULT 0,
  voucher_code VARCHAR(50) NOT NULL UNIQUE,
  voucher_hash VARCHAR(128) NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
  reward_redemption_id UUID REFERENCES redeemed_loyalty_rewards(id) ON DELETE SET NULL,
  points_delta INTEGER NOT NULL,
  transaction_type loyalty_transaction_type NOT NULL,
  balance_after_transaction INTEGER NOT NULL CHECK (balance_after_transaction >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text VARCHAR(300) NOT NULL,
  is_public_display_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved_by_moderator BOOLEAN NOT NULL DEFAULT FALSE,
  moderated_by_staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE corporate_sponsors (
  cnpj VARCHAR(14) PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  trade_name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  logo_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE corporate_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_cnpj VARCHAR(14) NOT NULL REFERENCES corporate_sponsors(cnpj) ON DELETE RESTRICT,
  intent_amount NUMERIC(14, 2) NOT NULL CHECK (intent_amount > 0),
  tax_incentive_fund tax_incentive_fund NOT NULL,
  status corporate_proposal_status NOT NULL DEFAULT 'DRAFT',
  contract_due_date DATE,
  has_social_seal_issued BOOLEAN NOT NULL DEFAULT FALSE,
  social_seal_expires_at DATE,
  invoice_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE corporate_representatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_cnpj VARCHAR(14) NOT NULL REFERENCES corporate_sponsors(cnpj) ON DELETE CASCADE,
  representative_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cpf VARCHAR(11),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role_description VARCHAR(100) NOT NULL,
  permission_level representative_permission NOT NULL DEFAULT 'VIEWER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_ip_address VARCHAR(45) NOT NULL,
  action_category VARCHAR(50) NOT NULL,
  target_module VARCHAR(50) NOT NULL,
  action_description TEXT NOT NULL,
  changes_payload_json JSONB,
  log_hash VARCHAR(128) NOT NULL,
  previous_log_hash VARCHAR(128)
);

CREATE TABLE email_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  email_subject VARCHAR(255) NOT NULL,
  email_preview_text VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  delivery_status email_delivery_status NOT NULL DEFAULT 'QUEUED',
  sent_at TIMESTAMPTZ,
  failure_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chatbot_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_identifier VARCHAR(100) NOT NULL,
  patient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_query_text TEXT NOT NULL,
  bot_response_text TEXT NOT NULL,
  topic_category VARCHAR(100),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_protocol ON appointments(protocol_number);
CREATE INDEX idx_appointments_patient ON appointments(patient_user_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_exam ON appointments(exam_id);
CREATE INDEX idx_appointments_city ON appointments(city_id);
CREATE INDEX idx_appointments_created ON appointments(created_at);
CREATE INDEX idx_schedules_unit ON appointment_schedules(hospital_unit_id);
CREATE INDEX idx_schedules_doctor ON appointment_schedules(scheduled_doctor_user_id);
CREATE INDEX idx_schedules_date ON appointment_schedules(scheduled_date);
CREATE INDEX idx_attachments_appointment ON appointment_attachments(appointment_id);
CREATE INDEX idx_feedbacks_appointment ON appointment_feedbacks(appointment_id);
CREATE INDEX idx_clinical_records_patient ON patient_clinical_records(patient_user_id);
CREATE INDEX idx_symptom_diary_patient ON symptom_diary_entries(patient_user_id);
CREATE INDEX idx_donations_donor ON donations(donor_user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created ON donations(created_at);
CREATE INDEX idx_points_transactions_donor ON loyalty_points_transactions(donor_user_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_email_outbox_status ON email_outbox(delivery_status);
