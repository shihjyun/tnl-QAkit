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
  import LandingIntro from './shared/LandingIntro.svelte'
  import { QAStatus } from './stores/QAStatusStore.js'

  function handleClick() {
    document.querySelector('#qa-sections').style.display = 'block'
    document.querySelector('#qa-no-1').scrollIntoView({
      behavior: 'smooth',
    })
    document.querySelector('body').style.overflow = 'hidden'
  }
</script>

<!-- utils components -->
<MobileDetector />

<!-- content -->
<Header />
<main>
  <article class="main-grid-template">
    <section class="container-width mx-auto grid-full-cols">
      <LandingIntro />
    </section>
    <section class="container-width mx-auto grid-full-cols">
      <button on:click={handleClick} class="block border border-black mx-auto mb-6">開始作答</button>
    </section>
    <section class="container-width mx-auto grid-full-cols overflow-hidden" id="qa-sections" style="display:none">
      <QAsections />
    </section>
    {#if false}
      <!-- read more -->
      <section class="container-width mx-auto grid-full-cols">
        <ArticleList projectName="us-election-2020-article-lists-tc">
          <h2 class="text-center">延伸閱讀</h2>
        </ArticleList>
      </section>
    {/if}
  </article>
</main>
