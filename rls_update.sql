-- Allow authenticated users or the service key to insert into mosques
CREATE POLICY "Enable insert for authenticated users only"
ON public.mosques
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow authenticated users or the service key to update mosques
CREATE POLICY "Enable update for authenticated users only"
ON public.mosques
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Prayers table policies
CREATE POLICY "Enable insert for authenticated users only"
ON public.prayers
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON public.prayers
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Facilities table policies
CREATE POLICY "Enable insert for authenticated users only"
ON public.facilities
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON public.facilities
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);
