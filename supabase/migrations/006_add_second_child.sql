ALTER TABLE books ADD COLUMN IF NOT EXISTS second_child_profile_id UUID REFERENCES child_profiles(id);
