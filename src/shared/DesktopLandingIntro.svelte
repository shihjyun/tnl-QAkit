<style>
  #intro-img-shadow {
    background-color: #303030;
    transform: translate3d(12px, -12px, 0);
  }

  #intro-img {
    transform: translate3d(-12px, 12px, 0);
  }

  div[class*='intro-img-container'] {
  }

  img {
    object-fit: cover;
  }
</style>

<script>
  import ContentDataStore from '../stores/ContentDataStore.js'

  let introData

  // check store has fetched content data from GCS
  $: if ($ContentDataStore) {
    introData = $ContentDataStore['intro']
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
  <div class="relative" style="height: calc(100vh - 40.56px)">
    <div class="absolute">
      <svg width="540" viewBox="0 0 540 540" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M405.064 270C440.845 269.983 475.157 255.762 500.459 230.459C525.777 205.142 540 170.804 540 135V270H405.064ZM405 270V135L405 0C440.804 8.96335e-06 475.142 14.2232 500.459 39.5406C525.777 64.858 540 99.1958 540 135V0H405H270H0V134L135 134V135.436C135.008 117.664 138.5 100.066 145.276 83.6464C152.061 67.2068 162.005 52.2694 174.541 39.687C187.076 27.1047 201.959 17.1238 218.338 10.3143C234.717 3.50481 252.272 0 270 0V135.5V269L270 270L270 271V404.5V540C252.272 540 234.717 536.495 218.338 529.686C201.959 522.876 187.076 512.895 174.541 500.313C162.005 487.731 152.061 472.793 145.276 456.354C138.492 439.914 135 422.294 135 404.5C135 386.706 138.492 369.086 145.276 352.646C152.061 336.207 162.005 321.269 174.541 308.687C187.076 296.105 201.959 286.124 218.338 279.314C229.651 274.611 241.524 271.484 253.629 270C241.524 268.516 229.651 265.389 218.338 260.686C201.959 253.876 187.077 243.895 174.541 231.313C162.005 218.731 152.061 203.793 145.276 187.354C138.5 170.934 135.008 153.336 135 135.564L135 269L0 134.993V270H134.919C134.919 287.728 131.427 305.283 124.643 321.662C117.858 338.041 107.914 352.923 95.3784 365.459C82.8425 377.995 67.9602 387.939 51.5812 394.724C35.2272 401.498 17.7009 404.989 0 405V540H270H540V539.501L270 270L405 270Z"
          fill="#3699FF"
        />
      </svg>
    </div>
    <div class="absolute">
      <svg width="675" viewBox="0 0 676 675" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M540.082 0H675.082V405H540.082V0ZM124.724 456.581C131.508 440.202 135 422.647 135 404.919H6.74721e-05L5.72726e-05 539.919C17.7285 539.919 35.2834 536.427 51.6623 529.643C68.0413 522.858 82.9236 512.914 95.4595 500.378C107.995 487.842 117.939 472.96 124.724 456.581ZM270 405L540 675V405L270 405ZM0 3.45671e-06L135 135L135 1.52588e-05L0 3.45671e-06Z"
          fill="#1D4ABA"
        />
      </svg>
    </div>
    <div class="absolute" style="left:135px;">
      <svg width="540" viewBox="0 0 540 720" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M83.3377 10.3144C99.7167 3.50493 117.272 0.00012207 135 0.00012207V135.5L135 271C117.272 271 99.7167 267.495 83.3377 260.686C66.9588 253.876 52.0765 243.895 39.5406 231.313C27.0047 218.731 17.0607 203.793 10.2763 187.354C3.49188 170.914 1.96701e-06 153.294 1.96701e-06 135.5C1.96701e-06 117.706 3.49188 100.086 10.2763 83.6465C17.0606 67.2069 27.0047 52.2695 39.5406 39.6872C52.0765 27.1048 66.9588 17.124 83.3377 10.3144ZM540 675L405 540H540V675ZM270 675V720H0L1.96701e-06 675H270Z"
          fill="#FFC736"
        />
      </svg>
    </div>
    <div class="absolute" style="right:0; bottom: 20vh;">
      <svg width="162" height="270" viewBox="0 0 162 270" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M270.5 0L0 270H270.5V0Z" fill="#FFC736" />
      </svg>
    </div>
    <div class="absolute bottom-0" style="right:30vw;">
      <svg width="270" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 180"><defs>
          <clipPath id="clip-path">
            <rect width="270" height="180" style="fill:none" />
          </clipPath>
        </defs>
        <g style="clip-path:url(#clip-path)">
          <circle cx="135" cy="135" r="135" style="fill:#3699ff" />
        </g></svg>
    </div>
    <div class="absolute top-0" style="right:20vw;">
      <svg width="270" height="71" viewBox="0 0 270 71" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="270" width="71" height="270" transform="rotate(90 270 0)" fill="#1D4ABA" />
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
        <button
          on:click={handleClick}
          class="block w-64 rounded-lg border text-white text-xl tracking-widest bg-black mb-6 py-3 mx-auto"
        >開始作答</button>
      </div>
    </div>
  </div>
{/if}
