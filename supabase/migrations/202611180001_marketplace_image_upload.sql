-- DX STORE marketplace image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace-images', 'marketplace-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Marketplace images are publicly readable" on storage.objects;
create policy "Marketplace images are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'marketplace-images');

drop policy if exists "Users upload marketplace images to own folder" on storage.objects;
create policy "Users upload marketplace images to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'marketplace-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update marketplace images in own folder" on storage.objects;
create policy "Users update marketplace images in own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'marketplace-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'marketplace-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete marketplace images in own folder" on storage.objects;
create policy "Users delete marketplace images in own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'marketplace-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
