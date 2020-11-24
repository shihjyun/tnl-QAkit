<style>
  img {
    object-position: 50% 0;
    object-fit: cover;
  }

  div[class*='test'] {
    width: 100vw;
    height: 100vw;
  }
</style>

<script>
  import ContentDataStore from '../stores/ContentDataStore.js'

  let introData

  // check store has fetched content data from GCS
  $: if ($ContentDataStore) {
    introData = $ContentDataStore['intro']
  }

  $: console.log(introData)
</script>

<div class="relative test">
  <img
    class="absolute h-64 w-64 border-2 border-black"
    width="264"
    src="https://image1.thenewslens.com/2020/11/8g292g1wy1v5vpe62zo2jn2yr0p4yb.JPG?auto=compress&h=648&q=80&w=1080"
    alt=""
  />
  <div class="absolute h-64 w-64" />
</div>
