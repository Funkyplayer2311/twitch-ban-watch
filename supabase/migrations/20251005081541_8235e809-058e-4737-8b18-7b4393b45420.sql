-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create enum for permission roles
CREATE TYPE public.permission_role AS ENUM ('owner', 'editor', 'viewer');

-- Create ban_timers table
CREATE TABLE public.ban_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL,
  username TEXT NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on ban_timers
ALTER TABLE public.ban_timers ENABLE ROW LEVEL SECURITY;

-- Create permissions table for sharing
CREATE TABLE public.ban_list_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role permission_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(owner_id, user_id)
);

-- Enable RLS on permissions
ALTER TABLE public.ban_list_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has access to owner's ban list
CREATE OR REPLACE FUNCTION public.has_ban_list_access(_owner_id UUID, _user_id UUID, _min_role permission_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ban_list_permissions
    WHERE owner_id = _owner_id
    AND user_id = _user_id
    AND (
      CASE 
        WHEN _min_role = 'viewer' THEN role IN ('viewer', 'editor', 'owner')
        WHEN _min_role = 'editor' THEN role IN ('editor', 'owner')
        WHEN _min_role = 'owner' THEN role = 'owner'
      END
    )
  ) OR _owner_id = _user_id;
$$;

-- Ban timers policies
-- Users can view bans they own or have viewer access to
CREATE POLICY "Users can view accessible ban timers"
ON public.ban_timers FOR SELECT
USING (
  owner_id = auth.uid() OR
  public.has_ban_list_access(owner_id, auth.uid(), 'viewer')
);

-- Users can insert bans they own or have editor access to
CREATE POLICY "Users can insert ban timers"
ON public.ban_timers FOR INSERT
WITH CHECK (
  owner_id = auth.uid() OR
  public.has_ban_list_access(owner_id, auth.uid(), 'editor')
);

-- Users can delete bans they own or have editor access to
CREATE POLICY "Users can delete ban timers"
ON public.ban_timers FOR DELETE
USING (
  owner_id = auth.uid() OR
  public.has_ban_list_access(owner_id, auth.uid(), 'editor')
);

-- Permissions policies
-- Users can view permissions where they are the owner or the granted user
CREATE POLICY "Users can view their permissions"
ON public.ban_list_permissions FOR SELECT
USING (owner_id = auth.uid() OR user_id = auth.uid());

-- Only owners can manage permissions
CREATE POLICY "Owners can insert permissions"
ON public.ban_list_permissions FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Only owners can update permissions
CREATE POLICY "Owners can update permissions"
ON public.ban_list_permissions FOR UPDATE
USING (owner_id = auth.uid());

-- Only owners can delete permissions
CREATE POLICY "Owners can delete permissions"
ON public.ban_list_permissions FOR DELETE
USING (owner_id = auth.uid());