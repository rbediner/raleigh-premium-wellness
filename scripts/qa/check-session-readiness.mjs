/**
 * Purpose: Preserve backwards compatibility for earlier repo commands while
 * forwarding to the stricter canonical session readiness script.
 * Role: Lets older docs or habits keep working without duplicating logic.
 * Dependencies: Node.js only.
 * Risk: Low. This wrapper only imports and executes the canonical script.
 */

import { main } from "./verify-session-readiness.mjs";

main();
