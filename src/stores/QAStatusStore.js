import { writable } from "svelte/store";

let QAStatus = writable(null)
let QAFinalPage = writable(1)

export { QAStatus, QAFinalPage }