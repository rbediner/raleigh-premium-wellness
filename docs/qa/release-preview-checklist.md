# Release Preview Checklist

Use this after the Preview Deploy workflow finishes on `staging`.

## Preview Review

- Open the staging preview URL.
- Confirm the hero headline is correct.
- Confirm navigation anchors work.
- Confirm the preview banner is visible.
- Confirm the preview page is clearly not the live site.
- Confirm the preview should not be indexed by search engines.

## Form Review

- Confirm each path in the unified form changes the visible fields.
- Confirm the submit button label changes with the selected path.
- Confirm required-field validation still works.

## Approval Rule

- Only approve the preview if the exact staged commit is the one you want to promote.
- If copy or layout changes are needed, send them back to `staging` first.
