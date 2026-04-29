# Supabase Database Schema

## Tables to Create

### campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'archived')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_templates
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### contact_lists
```sql
CREATE TABLE contact_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  list_id UUID REFERENCES contact_lists(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suppressed', 'suppressed complaint')),
  suppression_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, list_id)
);
```

### contact_suppression
```sql
CREATE TABLE contact_suppression (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'manual', 'ses')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);
```

### email_events
```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  email TEXT NOT NULL,
  message_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('bounce', 'complaint', 'delivery', 'open', 'click')),
  bounce_type TEXT,
  bounce_sub_type TEXT,
  complaint_type TEXT,
  smtp_response TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  raw_event JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### indexes for performance
```sql
CREATE INDEX idx_email_events_email ON email_events(email);
CREATE INDEX idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX idx_email_events_contact_id ON email_events(contact_id);
CREATE INDEX idx_email_events_event_type ON email_events(event_type);
CREATE INDEX idx_email_events_created_at ON email_events(created_at);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_list_id ON contacts(list_id);
CREATE INDEX idx_contact_suppression_email ON contact_suppression(email);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at);
```
