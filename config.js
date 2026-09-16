/* ------------------------------------------------------------------
   Supabase connection.

   Leave these empty and the page still works — votes are just kept in
   your own browser, so everyone sees only their own picks. Fine for a
   preview, useless for actually deciding.

   Fill both in and votes become shared and live for the whole group.
   Setup steps are in README.md (about five minutes).

   The anon key is *meant* to be public — it's in every visitor's
   browser either way. Row level security is what protects the table.
------------------------------------------------------------------ */

window.SUPABASE_CONFIG = {
  url: "",      // e.g. "https://abcdefghijklm.supabase.co"
  anonKey: ""   // the long "anon / public" key from Project Settings → API
};
