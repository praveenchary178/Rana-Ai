// The demo form now lives on its own page (app/book-demo). This module only re-exports the shared prefill type
// for the Talk to Rana component; new code should import from "@/app/book-demo/link".
export type { DemoPrefill } from "../book-demo/link";
