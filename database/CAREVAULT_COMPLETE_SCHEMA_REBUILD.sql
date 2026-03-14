-- ==========================================
-- CareVault Complete Database Schema Rebuild
-- 完整删除并重建所有表结构
-- 版本: 3.0 (最终修复版)
-- 日期: 2026-01-19
-- ==========================================
-- 
-- 此脚本会:
-- 1. 删除所有现有表和依赖关系
-- 2. 创建正确的表结构(修复了所有已知问题)
-- 3. 设置完整的RLS策略
-- 4. 创建索引和触发器
-- 5. 配置Storage Bucket
-- ==========================================

-- ==========================================
-- STEP 1: 清理现有Schema (CASCADE删除所有依赖)
-- ==========================================

-- 删除所有RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Caregivers can view own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Caregivers can insert own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Caregivers can update own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Caregivers can delete own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Users can manage related medical records" ON medical_records CASCADE;
DROP POLICY IF EXISTS "Users can manage related appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can manage related documents" ON documents CASCADE;
DROP POLICY IF EXISTS "Users can manage related emergency contacts" ON emergency_contacts CASCADE;

-- 删除Storage RLS策略
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can view" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects CASCADE;

-- 删除视图
DROP VIEW IF EXISTS patient_overview CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS get_upcoming_appointments(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS generate_emergency_summary(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 删除所有表 (CASCADE会自动删除触发器和索引)
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS care_recipients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- STEP 2: 启用必要的PostgreSQL扩展
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- STEP 3: 创建核心表结构
-- ==========================================

-- 3.1 用户表 (关联Supabase Auth)
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'caregiver' CHECK (role IN ('caregiver', 'patient', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS '用户基本信息表';
COMMENT ON COLUMN users.role IS '用户角色: caregiver(照护者), patient(患者), admin(管理员)';

-- 3.2 受照护人表 (核心实体 - 修复版，移除了name字段)
CREATE TABLE care_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  relationship text,
  photo_url text,
  notes text,
  diagnosis text,
  medications text,
  allergies text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE care_recipients IS '受照护人信息表 - 每个照护者可管理多个受照护人';
COMMENT ON COLUMN care_recipients.caregiver_id IS '照护者UUID，关联auth.users';
COMMENT ON COLUMN care_recipients.first_name IS '名';
COMMENT ON COLUMN care_recipients.last_name IS '姓';
COMMENT ON COLUMN care_recipients.relationship IS '与照护者的关系';
COMMENT ON COLUMN care_recipients.diagnosis IS '诊断信息';
COMMENT ON COLUMN care_recipients.medications IS '当前用药概览';
COMMENT ON COLUMN care_recipients.allergies IS '过敏信息';

-- 3.3 医疗记录表
CREATE TABLE medical_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('medications', 'conditions', 'doctors')),
  name text NOT NULL,
  details text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE medical_records IS '医疗记录: 药物、病情、医生信息';
COMMENT ON COLUMN medical_records.type IS 'medications(药物), conditions(病情), doctors(医生)';

-- 3.4 预约提醒表
CREATE TABLE appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  appointment_date timestamptz NOT NULL,
  remind_before_minutes integer DEFAULT 30,
  repeat_interval text DEFAULT 'none' CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE appointments IS '预约和提醒管理';
COMMENT ON COLUMN appointments.remind_before_minutes IS '提前提醒分钟数';
COMMENT ON COLUMN appointments.repeat_interval IS '重复间隔';

-- 3.5 文档管理表
CREATE TABLE documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('legal', 'medical', 'financial', 'identification')),
  file_url text,
  file_name text,
  file_size integer,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE documents IS '文档存储管理';
COMMENT ON COLUMN documents.category IS 'legal(法律), medical(医疗), financial(财务), identification(身份)';

-- 3.6 紧急联系人表
CREATE TABLE emergency_contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid REFERENCES care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE emergency_contacts IS '紧急联系人信息';

-- ==========================================
-- STEP 4: 创建性能优化索引
-- ==========================================

-- users表索引
CREATE INDEX idx_users_role ON users(role);

-- care_recipients表索引
CREATE INDEX idx_care_recipients_caregiver ON care_recipients(caregiver_id);
CREATE INDEX idx_care_recipients_active ON care_recipients(is_active);
CREATE INDEX idx_care_recipients_created_at ON care_recipients(created_at DESC);

-- medical_records表索引
CREATE INDEX idx_medical_records_recipient ON medical_records(care_recipient_id);
CREATE INDEX idx_medical_records_type ON medical_records(type);
CREATE INDEX idx_medical_records_date ON medical_records(date DESC);

-- appointments表索引
CREATE INDEX idx_appointments_recipient ON appointments(care_recipient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_completed ON appointments(is_completed);

-- documents表索引
CREATE INDEX idx_documents_recipient ON documents(care_recipient_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_date ON documents(date DESC);

-- emergency_contacts表索引
CREATE INDEX idx_emergency_contacts_recipient ON emergency_contacts(care_recipient_id);
CREATE INDEX idx_emergency_contacts_primary ON emergency_contacts(is_primary);

-- ==========================================
-- STEP 5: 创建自动更新触发器
-- ==========================================

-- 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加触发器
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_recipients_updated_at 
  BEFORE UPDATE ON care_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at 
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at 
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- STEP 6: 配置Storage Bucket
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STEP 7: 启用Row Level Security
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 8: 创建RLS策略 - 数据隔离
-- ==========================================

-- 8.1 Users表策略
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 8.2 Care Recipients表策略 (核心数据隔离)
CREATE POLICY "Caregivers can view own patients" 
  ON care_recipients FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can insert own patients" 
  ON care_recipients FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can update own patients" 
  ON care_recipients FOR UPDATE
  TO authenticated
  USING (caregiver_id = auth.uid())
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can delete own patients" 
  ON care_recipients FOR DELETE
  TO authenticated
  USING (caregiver_id = auth.uid());

-- 8.3 Medical Records表策略
CREATE POLICY "Users can manage related medical records" 
  ON medical_records FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  );

-- 8.4 Appointments表策略
CREATE POLICY "Users can manage related appointments" 
  ON appointments FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  );

-- 8.5 Documents表策略
CREATE POLICY "Users can manage related documents" 
  ON documents FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  );

-- 8.6 Emergency Contacts表策略
CREATE POLICY "Users can manage related emergency contacts" 
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients WHERE caregiver_id = auth.uid()
    )
  );

-- ==========================================
-- STEP 9: Storage RLS策略
-- ==========================================

CREATE POLICY "Authenticated users can upload" 
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view" 
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update" 
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete" 
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- ==========================================
-- STEP 10: 创建实用视图
-- ==========================================

CREATE OR REPLACE VIEW patient_overview AS
SELECT 
  cr.id,
  cr.caregiver_id,
  cr.first_name || ' ' || cr.last_name AS full_name,
  cr.first_name,
  cr.last_name,
  cr.date_of_birth,
  EXTRACT(YEAR FROM age(cr.date_of_birth)) AS age,
  cr.relationship,
  cr.diagnosis,
  cr.allergies,
  cr.emergency_contact_name,
  cr.emergency_contact_phone,
  cr.emergency_contact_relationship,
  cr.is_active,
  COUNT(DISTINCT mr.id) FILTER (WHERE mr.type = 'medications') AS medication_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.is_completed = false AND a.appointment_date > now()) AS upcoming_appointments_count,
  COUNT(DISTINCT d.id) AS document_count,
  cr.created_at,
  cr.updated_at
FROM care_recipients cr
LEFT JOIN medical_records mr ON cr.id = mr.care_recipient_id
LEFT JOIN appointments a ON cr.id = a.care_recipient_id
LEFT JOIN documents d ON cr.id = d.care_recipient_id
GROUP BY cr.id;

-- ==========================================
-- STEP 11: 创建实用函数
-- ==========================================

-- 11.1 获取即将到来的预约
CREATE OR REPLACE FUNCTION get_upcoming_appointments(patient_id uuid, days_ahead integer DEFAULT 7)
RETURNS TABLE (
  id uuid,
  title text,
  appointment_date timestamptz,
  days_until integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.appointment_date,
    EXTRACT(DAY FROM (a.appointment_date - now()))::integer AS days_until
  FROM appointments a
  WHERE a.care_recipient_id = patient_id
    AND a.is_completed = false
    AND a.appointment_date > now()
    AND a.appointment_date <= now() + (days_ahead || ' days')::interval
  ORDER BY a.appointment_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11.2 生成紧急摘要
CREATE OR REPLACE FUNCTION generate_emergency_summary(patient_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'patient', json_build_object(
      'name', first_name || ' ' || last_name,
      'date_of_birth', date_of_birth,
      'age', EXTRACT(YEAR FROM age(date_of_birth)),
      'diagnosis', diagnosis,
      'allergies', allergies
    ),
    'emergency_contact', json_build_object(
      'name', emergency_contact_name,
      'phone', emergency_contact_phone,
      'relationship', emergency_contact_relationship
    ),
    'medications', (
      SELECT json_agg(json_build_object(
        'name', name,
        'details', details,
        'date', date
      ))
      FROM medical_records
      WHERE care_recipient_id = patient_id AND type = 'medications'
      ORDER BY date DESC
      LIMIT 10
    ),
    'recent_conditions', (
      SELECT json_agg(json_build_object(
        'name', name,
        'details', details,
        'date', date
      ))
      FROM medical_records
      WHERE care_recipient_id = patient_id AND type = 'conditions'
      ORDER BY date DESC
      LIMIT 5
    )
  ) INTO result
  FROM care_recipients
  WHERE id = patient_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STEP 12: 验证Schema创建
-- ==========================================

-- 验证表结构
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'care_recipients', 'medical_records', 'appointments', 'documents', 'emergency_contacts')
ORDER BY table_name, ordinal_position;

-- 验证RLS策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 验证索引
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'care_recipients', 'medical_records', 'appointments', 'documents', 'emergency_contacts')
ORDER BY tablename, indexname;

-- ==========================================
-- 完成!
-- ==========================================
-- 数据库Schema已完全重建
-- 所有已知问题已修复:
-- ✅ 移除了care_recipients表中的name字段
-- ✅ 移除了users表中的linked_patient_id字段
-- ✅ 正确配置了RLS策略
-- ✅ 创建了完整的索引和触发器
-- ==========================================
