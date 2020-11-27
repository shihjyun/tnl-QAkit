import {writable} from 'svelte/store';

const contentDataUrl = 'https://datastore.thenewslens.com/infographic/QA-AIDS-2020/QA-AIDS-2020.json?2w233132322'

const ContentDataStore = writable(null, async set => {
  const res = await fetch(contentDataUrl);
  const data = await res.json();
  console.log(data);
  set(data);
  return () => {};
});

export default ContentDataStore