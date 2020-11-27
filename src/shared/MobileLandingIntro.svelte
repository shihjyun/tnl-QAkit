<style>
  img {
    object-position: 50% 0;
    object-fit: cover;
  }

  div[class*='intro-img-container'] {
    width: 100vw;
    height: 100vw;
  }

  #intro-img-shadow {
    background-color: #303030;
    transform: translate3d(12px, -12px, 0);
  }

  #intro-img {
    transform: translate3d(-12px, 12px, 0);
  }
  #intro-sp-line {
    border-bottom: 4px solid #ececec;
  }
  button {
    letter-spacing: 0.2em;
  }
</style>

<script>
  import ContentDataStore from '../stores/ContentDataStore.js'
  import ThemeStore from '../stores/ThemeStore.js'

  let introData
  let themeNum = '1'

  // check store has fetched content data from GCS
  $: if ($ContentDataStore) {
    introData = $ContentDataStore['intro']
    themeNum = $ContentDataStore['theme']
  }

  function handleClick() {
    document.querySelector('#qa-sections').style.display = 'block'
    document.querySelector('#qa-no-1').scrollIntoView({
      behavior: 'smooth',
    })
    document.querySelector('body').style.overflow = 'hidden'
  }
</script>

{#if $ContentDataStore}
  <div class="flex relative justify-center items-center intro-img-container">
    <div class="absolute left-0">
      <svg width="75vw" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><path
          d="M80,0H0V320H240L80,160H240V87.84A80,80,0,0,1,160.38,160V0A80,80,0,0,1,240,72.16V0H80Zm0,0V160A80,80,0,0,1,80,0Zm0,160V320a80,80,0,0,1,0-160Z"
          style="fill:{$ThemeStore[themeNum][1]};fill-rule:evenodd"
        /></svg>
    </div>
    <div class="absolute right-0">
      <svg width="75vw" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><path
          d="M240,0H160V160H0L160,320V160h80Z"
          style="fill:{$ThemeStore[themeNum][0]};fill-rule:evenodd"
        /></svg>
    </div>
    <div class="absolute">
      <svg width="100vw" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><path
          d="M49.39,6.09A80,80,0,0,1,80,0V160A80,80,0,0,1,49.39,6.09ZM240,240l80,80V240Z"
          style="fill:{$ThemeStore[themeNum][2]};fill-rule:evenodd"
        /></svg>
    </div>
    <div class="relative" style="width: 82.5%; height: 82.5%;">
      <div class="absolute bg-black h-full w-full" id="intro-img-shadow" />
      <img
        class="absolute border-4 border-black h-full w-full"
        src={introData.cover_image.url}
        alt={introData.cover_image.discription}
        id="intro-img"
      />
    </div>
  </div>
  <h1 class="px-4 pt-4">{introData.title}</h1>
  <div class="basic-p-container">
    {#each introData.content as { text }}
      <p class="pt-4">{text}</p>
    {/each}
  </div>
{/if}
<div class="px-4 mx-auto">
  <button
    on:click={handleClick}
    class="block w-full rounded-lg border text-white text-xl tracking-widest bg-black mb-6 py-3"
    style="background-color:{$ThemeStore[themeNum][0]};"
  >開始作答</button>
</div>
<div class="px-4 pb-5 mb-3 mx-4" id="intro-sp-line" />
