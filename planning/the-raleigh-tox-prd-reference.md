# The Raleigh Tox PRD Reference

- Google Doc ID: `1E0pqPtVzGe75XdbOS_B8vuEKNgx9_iTytT4uCVgIt-M`
- Google Doc URL: <https://docs.google.com/document/d/1E0pqPtVzGe75XdbOS_B8vuEKNgx9_iTytT4uCVgIt-M/edit>
- Purpose: canonical product requirements document for this repo
- Note: this checked-in reference replaces cloud-synced `.gdoc` shortcut files because those are not stable across machines

## Operational Delivery Note

- As of `2026-04-14`, the verified working BL-2 notification destination is
  `roman.bediner+thetox@cormanity.com`.
- Reason:
  - live Apps Script sends are observable in the `roman.bediner@cormanity.com` sent mailbox
  - delivery to `roman.bediner@thetox.com` is not currently observable in the receiving inbox
  - `thetox@cormanity.com` is an alias on the sender mailbox and is not a reliable proof target for delivery
- Follow-up mail-admin work should investigate `@thetox.com` routing separately without blocking the verified operational inbox path above.
