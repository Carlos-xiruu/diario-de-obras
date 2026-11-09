# Supabase

`read-schema.sql` is intentionally read-only. Execute it in the Supabase SQL
Editor and retain the output with the implementation discussion.

`migrations/` contains versioned migrations prepared locally, not applied. Run
them only in the order documented by the production runbook after a backup and
review. `proposed-migrations/` is intentionally excluded from that order until
the catalogue implementation begins.
