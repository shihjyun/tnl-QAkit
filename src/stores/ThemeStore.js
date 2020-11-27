import { readable } from "svelte/store";

const ThemeStore = readable({
  "1": ['#272727', '#6C6C6C', '#CACACA'],
  "2": ['#A52222', '#E51F1F', '#FFC736'],
  "3": ['#2274A5', '#1DB1BA', '#FF9A51'],
  "4": ['#1D4ABA', '#3699FF', '#FFC736']
});

export default ThemeStore