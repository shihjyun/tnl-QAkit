<style>
  .container-width {
    width: 100%;
  }
</style>

<script>
  import Header from './shared/Header.svelte'
  import MobileDetector from './utils/MobileDetector.svelte'
  import QAsections from './shared/QASections.svelte'
  import BasicParagraphs from './shared/BasicParagraphs.svelte'
  import ArticleList from './shared/ArticleList.svelte'
  import MobileLandingIntro from './shared/MobileLandingIntro.svelte'
  import DesktopLandingIntro from './shared/DesktopLandingIntro.svelte'
  import { QAStatus } from './stores/QAStatusStore.js'
  import { isMobile } from './stores/DeviceDetectorStore.js'
  import ThemeStore from './stores/ThemeStore.js'
  import ContentDataStore from './stores/ContentDataStore.js'

  let themeNum = '1'
  let shareUrl, tnlDomainPageId

  $: if ($ContentDataStore) {
    themeNum = $ContentDataStore['theme']
  }
</script>

<!-- utils components -->
<MobileDetector />

<!-- content -->
<Header />
<main class="bg-white">
  <article class="main-grid-template">
    <section class="container-width mx-auto grid-full-cols">
      {#if $isMobile}
        <MobileLandingIntro />
      {:else}
        <DesktopLandingIntro />
      {/if}
    </section>
    <section
      class="relative container-width mx-auto grid-full-cols overflow-hidden"
      id="qa-sections"
      style="display:none"
    >
      {#if !$isMobile}
        <div class="absolute left-0 top-0">
          <svg width="269" height="272" viewBox="0 0 269 272" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M-1.00003 272C34.4569 272 69.5666 264.964 102.325 251.295C135.082 237.626 164.847 217.591 189.919 192.333C214.991 167.075 234.879 137.09 248.447 104.09C262.016 71.0893 269 35.7195 269 0L-1.00001 6.91343e-06L-1.00003 272Z"
              fill={$ThemeStore[themeNum][0]}
            />
          </svg>
        </div>
        <div class="absolute right-0 bottom-0">
          <svg width="162" height="270" viewBox="0 0 162 270" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M270.5 0L0 270H270.5V0Z" fill={$ThemeStore[themeNum][2]} />
          </svg>
        </div>
        <div class="absolute" style="bottom: 20vh; left: 19vw;">
          <svg width="227" height="455" viewBox="0 0 227 455" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M227 0C197.19 -3.56265e-07 167.672 5.88446 140.131 17.3174C112.59 28.7504 87.5657 45.5079 66.4868 66.6332C45.4079 87.7585 28.6872 112.838 17.2793 140.44C5.87153 168.041 -9.47558e-07 197.624 0 227.5C9.47558e-07 257.376 5.87153 286.959 17.2794 314.56C28.6872 342.162 45.4079 367.241 66.4868 388.367C87.5657 409.492 112.59 426.25 140.131 437.683C167.672 449.116 197.19 455 227 455L227 227.5V0Z"
              fill={$ThemeStore[themeNum][2]}
            />
          </svg>
        </div>
        <div class="absolute right-0" style="bottom: 50vh;">
          <svg width="814" height="240" viewBox="0 0 814 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="240" width="240" height="814" transform="rotate(-90 0 240)" fill={$ThemeStore[themeNum][1]} />
          </svg>
        </div>
      {/if}
      <QAsections />
    </section>
  </article>
</main>
