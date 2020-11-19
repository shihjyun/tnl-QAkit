import {writable} from 'svelte/store';

const contentDataUrl = 'https://datastore.thenewslens.com/infographic/test/test.json?sffdf'

const ContentDataStore = writable(null, async set => {
  const res = await fetch(contentDataUrl);
  const data = await res.json();
  set(data);
  return () => {};
});

export default ContentDataStore