<style>
  #intro-img-shadow {
    background-color: #303030;
    transform: translate3d(12px, -12px, 0);
  }

  #intro-img {
    transform: translate3d(-12px, 12px, 0);
  }

  .shadow-sp {
    -webkit-box-shadow: 0px 4px 12px rgba(130, 130, 130, 0.25);
    box-shadow: 0px 4px 12px rgba(130, 130, 130, 0.25);
  }

  img {
    object-fit: cover;
  }
</style>

<script>
  import ContentDataStore from '../stores/ContentDataStore.js'
  import ThemeStore from '../stores/ThemeStore.js'
  import CTAnimation from '../shared/CTAnimation.svelte'

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
  <div class="relative w-full" style="height: calc(100vh - 40.56px)">
    <div class="absolute" style="height: calc(100vh - 40.56px); max-width: 46.875%; overflow: hidden;">
      <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 676 720"><rect
          id="rec"
          width="540"
          height="720"
          style="fill:{$ThemeStore[themeNum][1]}"
        />
        <path
          id="yellow"
          d="M218.34,10.31A134.54,134.54,0,0,1,270,0V271A135.62,135.62,0,0,1,174.54,39.69,134.92,134.92,0,0,1,218.34,10.31ZM675,675,540,540H675Zm-270,0v45H135V675Z"
          style="fill:{$ThemeStore[themeNum][2]};fill-rule:evenodd"
        />
        <path
          id="darkblue"
          d="M540.08,0h135V405h-135ZM124.72,456.58A134.89,134.89,0,0,0,135,404.92H0v135a134.89,134.89,0,0,0,51.66-10.28,135.06,135.06,0,0,0,43.8-29.26A134.9,134.9,0,0,0,124.72,456.58ZM270,405,540,675V405ZM0,0,135,135V0Z"
          style="fill:{$ThemeStore[themeNum][0]};fill-rule:evenodd"
        />
        <path
          d="M500.46,230.46A135,135,0,0,1,405,270V0a135,135,0,0,1,95.46,230.46ZM135,404,0,270H135Zm135,0a135.5,135.5,0,0,0,0,271V404Z"
          style="fill:#fff;fill-rule:evenodd"
        /></svg>
    </div>
    <div class="absolute" style="right:0; bottom: 20vh;">
      <svg width="162" height="270" viewBox="0 0 162 270" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M270.5 0L0 270H270.5V0Z" fill={$ThemeStore[themeNum][2]} />
      </svg>
    </div>
    <div class="absolute bottom-0" style="right:30vw;">
      <svg width="270" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 180"><defs>
          <clipPath id="clip-path">
            <rect width="270" height="180" style="fill:none" />
          </clipPath>
        </defs>
        <g style="clip-path:url(#clip-path)">
          <circle cx="135" cy="135" r="135" style="fill:{$ThemeStore[themeNum][1]}" />
        </g></svg>
    </div>
    <div class="absolute top-0" style="right:20vw;">
      <svg width="270" height="71" viewBox="0 0 270 71" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="270" width="71" height="270" transform="rotate(90 270 0)" fill={$ThemeStore[themeNum][0]} />
      </svg>
    </div>
    <div class="absolute inline-flex justify-center items-center" style="top: 15vh;">
      <div lass="flex justify-center items-center intro-img-container">
        <div class="relative" style="width: 45.13vw; height: 23.62vw; margin-left: 10vw;">
          <div class="absolute bg-black h-full w-full" id="intro-img-shadow" />
          <img
            class="absolute border-4 border-black h-full w-full"
            src={introData.cover_image.url}
            alt={introData.cover_image.discription}
            id="intro-img"
          />
        </div>
      </div>
      <div class="mx-8">
        <h1 class="mx-4">{introData.title}</h1>
        <div class="basic-p-container">
          {#each introData.content as { text }}
            <p class="pt-4">{text}</p>
          {/each}
        </div>
        <div class="grid grid-cols-5 w-full" style="transform: translateY(100px);">
          <button
            on:click={handleClick}
            class="col-start-2 col-end-5 block w-64 rounded-lg border text-white text-xl tracking-widest m-auto py-3 mx-auto shadow-sp z-10"
            style="background-color:{$ThemeStore[themeNum][0]};"
          >開始作答</button>
          <!-- <div class="col-start-5 col-end-6 relative h-full">
            <CTAnimation />
          </div> -->
        </div>
      </div>
    </div>
  </div>
{/if}
