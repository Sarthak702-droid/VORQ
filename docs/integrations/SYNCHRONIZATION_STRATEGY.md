# Synchronization and reconciliation

Current operations are same-site Frappe transactions, so no cross-system eventual consistency is needed for ERPNext/BuildSuite. Writes use native documents and upstream accounting/stock controllers. A durable VORQ Request record stores payload digest and target link in the same transaction. Invoice and stock reconciliation reads authoritative ERPNext records, never React totals.

Server work-order locks serialize RA line derivation and submit so a second bill cannot consume already billed certified quantities. This requires concurrency tests against MariaDB before accepting the guarantee. Optimistic modified checks reject stale browser edits. BOQ parent locks prevent baseline edits during approval.

External engines remain disconnected. Future external commands need a transactional outbox, deterministic operation ID, unique identity mapping, bounded exponential backoff/jitter, retry dead-letter state, version conflict handling and an operator reconciliation view. Do not enable bidirectional schedule writes. A schedule authority change requires controlled migration of IDs/dependencies before cutover.

Offline writes are currently unavailable. No client-only draft is labeled synchronized. Financial writes must remain online and require server confirmation.
