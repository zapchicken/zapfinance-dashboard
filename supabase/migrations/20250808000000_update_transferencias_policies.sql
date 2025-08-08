-- Secure transferencias with per-user policies via related bancos

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.transferencias ENABLE ROW LEVEL SECURITY;

-- Drop permissive policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'transferencias' 
      AND policyname = 'Allow all operations on transferencias'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all operations on transferencias" ON public.transferencias';
  END IF;
END $$;

-- SELECT: user must own either origem or destino bank
CREATE POLICY IF NOT EXISTS transferencias_select_own
ON public.transferencias
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bancos b
    WHERE b.id = banco_origem_id AND b.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.bancos b
    WHERE b.id = banco_destino_id AND b.user_id = auth.uid()
  )
);

-- INSERT: user must own both banks
CREATE POLICY IF NOT EXISTS transferencias_insert_own
ON public.transferencias
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bancos b1
    WHERE b1.id = banco_origem_id AND b1.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.bancos b2
    WHERE b2.id = banco_destino_id AND b2.user_id = auth.uid()
  )
);

-- UPDATE: user must own at least one side and preserve ownership constraint
CREATE POLICY IF NOT EXISTS transferencias_update_own
ON public.transferencias
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bancos b
    WHERE (b.id = banco_origem_id OR b.id = banco_destino_id) AND b.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bancos b1
    WHERE b1.id = banco_origem_id AND b1.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.bancos b2
    WHERE b2.id = banco_destino_id AND b2.user_id = auth.uid()
  )
);

-- DELETE: user must own at least one side
CREATE POLICY IF NOT EXISTS transferencias_delete_own
ON public.transferencias
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.bancos b
    WHERE (b.id = banco_origem_id OR b.id = banco_destino_id) AND b.user_id = auth.uid()
  )
);

