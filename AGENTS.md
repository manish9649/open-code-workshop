<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep appointment-letter rendering in the existing member document module, using its design version to replace outdated saved PDFs without adding a second admin feature.
- Member registration must not fetch a bundled default signature; allow an empty legacy signature path and keep photos and letters in administrator-only private member storage.
- Keep the manual-QR donation presentation in the existing donation route; do not claim form submissions are saved until a delivery service is connected.
- QR donation submissions use a validated server function, private screenshot storage, database uniqueness for retries and UTRs, and pending status; show confirmation only after saving, because uploads do not verify payments.
- Donation forms omit identity-document fields; validate optional payment screenshots through the shared submission schema and keep uploaded files private to avoid unnecessary sensitive-document collection.
- Keep private administration page metadata in the shared admin-head helper to provide distinct titles and no-index metadata consistently.
- Cache server-verified administrator access only in browser memory, scoped to the current token for at most five minutes and cleared on auth changes; database policies and server authorization remain authoritative.
- Serve variable fonts locally with font-display swap and render page content immediately; defer the optional homepage gallery until near the viewport without delaying the page.
