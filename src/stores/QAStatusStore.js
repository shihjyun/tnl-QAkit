import { writable } from "svelte/store";

let QAStatus = writable(null)
let QAFinalPage = writable(1)
let QASectionsHeight = writable(null)
let QAProgress = writable(1)
let RightAnswerCalc = writable(0)
let QAProgressArray = writable(null)

export { QAStatus, QAFinalPage, QASectionsHeight, QAProgress, RightAnswerCalc, QAProgressArray }