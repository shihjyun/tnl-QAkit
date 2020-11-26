import {writable} from 'svelte/store';

const contentDataUrl = 'https://datastore.thenewslens.com/infographic/QA-AIDS-2020/QA-AIDS-2020.json?222'

const ContentDataStore = writable(null, async set => {
  const res = await fetch(contentDataUrl);
  const data = await res.json();
  console.log(data);
  set(data);
  return () => {};
});

export default ContentDataStore