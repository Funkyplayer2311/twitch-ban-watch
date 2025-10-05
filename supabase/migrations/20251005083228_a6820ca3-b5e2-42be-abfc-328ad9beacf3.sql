-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Create updated function that generates unique usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from metadata or fallback to email prefix
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Sanitize: remove non-alphanumeric characters
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');

  -- Fallback if base_username is empty
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Ensure uniqueness by appending a counter
  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE username = final_username
  ) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  -- Insert profile row
  INSERT INTO public.profiles (id, user_id, username, email)
  VALUES (NEW.id, NEW.id, final_username, NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
