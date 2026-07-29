# ZIPDAM Codex Instructions

Read `docs/ZIPDAM_CODEX_CONTEXT.md` before editing this repository or the connected backend.

## Non-negotiable rules

- Canonical customer identity is the real LINE user ID.
- For real LINE users: `customerId === lineUserId`.
- Same LINE ID is one customer even when the display name changes.
- `GUEST-*` must not count toward customer lifetime totals or rewards.
- Do not reintroduce `paymentStatus` or `paidAt`.
- Preserve all existing sales report sheets.
- Google Sheets reads and writes must use exact header-name mapping, never fixed column numbers.
- Frontend order payload must continue to include `idToken`, `lineUserId`, `displayName`, customer contact fields and cart items.
- Backend implementation is in `mamamansion99/ZIPDAM-backend/Code.js`.
- Never commit LINE tokens, webhook secrets or customer private information.

Run or inspect the Apps Script `?action=health` endpoint after spreadsheet-schema changes.