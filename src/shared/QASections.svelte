<style>
  #qa-container {
    height: 100vh;
    transform: translate3d(0, calc(var(--transleteY) * 1px), 0);
  }
  .qa-section {
    width: 100%;
  }

  img {
    width: 100%;
    height: 100%;
  }
</style>

<script>
  import { cssVariables, getAllSectionsHeight } from '../utils/helper.js'
  import { isMobile } from '../stores/DeviceDetectorStore.js'
  import { tweened } from 'svelte/motion'
  import { quintOut, linear } from 'svelte/easing'
  import { onMount } from 'svelte'
  import {
    QAFinalPage,
    QASectionsHeight,
    QAProgress,
    RightAnswerCalc,
    QAProgressArray,
  } from '../stores/QAStatusStore.js'
  import BasicParagraphs from './BasicParagraphs.svelte'
  import Footer from './Footer.svelte'
  import AnswerHeader from './AnswerHeader.svelte'
  import FinalCardBackground from './FinalCardBackground.svelte'
  import ArticleList from './ArticleList.svelte'
  import SocialBoxInArticle from './SocialBoxInArticle.svelte'
  import ContentDataStore from '../stores/ContentDataStore.js'
  import ThemeStore from '../stores/ThemeStore.js'
  import QATemplate from './QATemplate.svelte'

  // set tweened animation store
  const progress = tweened(0, {
    duration: 800,
    easing: quintOut,
  })

  let themeNum = '1'

  $: if ($ContentDataStore) {
    themeNum = $ContentDataStore['theme']
  }

  // click&touch movement handler initial setting variables
  let maxQuestion = 0 // the total question user need to answer
  let currentPage = 1 // the initail page when enter QA sections
  let mouseDown = false // true if user mousedown
  let isMoving = false // true if user click and move their mouse
  let windowHeight = window.innerHeight // screen height
  let movementDownY = 0, // the y-coordinate when user click down
    moveY = 0, // the y-coordinate when user move
    moveDiff = 0, // the distance that user move (movementDownY - moveY)
    newMovementY = 0, // the y-coordinate after user click up
    overflowHeight = 0,
    moveOverflowDiff = 0,
    scrollOverflowTick = 0,
    scrollSpeed = 41,
    clickUpMovementY = newMovementY
  let pageChangeThreshold = 0.1

  // update QAsectionHeight initially
  QASectionsHeight.update(() => windowHeight)

  // detect click&toych direction
  $: moveDirection = moveDiff <= 0 ? 'down' : 'up'

  // y-coordinate that qa-container need to translate (just like normal scroll effect)
  $: transleteY = $progress

  // scroll-liked movement initial setting variables
  let validToScroll = true // is wheel event fire now?
  let scrollLimit = false

  onMount(() => {
    // get all QA sections' height
    QASectionsHeight.update(() => getAllSectionsHeight())
    setTimeout(() => {
      maxQuestion = document.querySelectorAll('[id^="qa-no-"]').length - 1

      QAProgressArray.update(() => {
        let QAarray = $ContentDataStore.question_sets.map((d) => {
          let obj = {}
          obj['question_number'] = d.question_number
          obj['status'] = 'unanswered'
          return obj
        })
        return QAarray
      })
    }, 1000)
  })

  // function statement zone
  // the handler that click&touch down event & add event listener to qa-container
  function handleMovementDown(e) {
    const QAcontainer = document.getElementById('qa-container')
    mouseDown = true
    // prevent error message mouse event trigger when user click nested button
    if (!e.touches && $isMobile) return
    movementDownY = $isMobile ? e.touches[0].clientY : e.clientY

    // add mousemove, mouseup event to `qa-container`
    QAcontainer.addEventListener('mousemove', handleMove)
    QAcontainer.addEventListener('mouseup', handleMovementUp)
    QAcontainer.addEventListener('touchmove', handleMove, { passive: true })
    QAcontainer.addEventListener('touchend', handleMovementUp)
  }

  // the handler of click&touch move event
  function handleMove(e) {
    e.stopPropagation()
    if (mouseDown) {
      isMoving = true
      moveY = $isMobile ? e.touches[0].clientY : e.clientY
      moveDiff = (moveY - movementDownY) * 0.5 // moveDiff * 0.6 can prevent decrease distance that user move

      // check overflowHeight
      updateOverflowInfo()
      newMovementY = clickUpMovementY + moveDiff
      progress.set(newMovementY, { duration: 0 }) // update the latest coordinate to progress store
    }
  }

  // the handler of click&touch up event
  function handleMovementUp(e) {
    e.stopPropagation()
    const QAcontainer = document.getElementById('qa-container')

    // reset setting varialbes when movement ending
    isMoving = false
    mouseDown = false
    moveY = 0
    movementDownY = 0

    // detect if there's a overflow height section
    if (checkOverflowSection()) {
      clickUpMovementY = newMovementY
      progress.set(newMovementY, { duration: 0 })
      moveDiff = 0
    } else {
      // if not, use normal scroll mode
      if (Math.abs(moveDiff) > windowHeight * pageChangeThreshold && !isOnQAsectionsTopOrEnd()) {
        moveToNextPage()
        moveDiff = 0
      } else {
        // improve user experience when scroll over the valid zone
        progress.set(newMovementY, { duration: 0 })
        progress.set(-totalSectionsHeight(0, currentPage - 1))
        newMovementY = -totalSectionsHeight(0, currentPage - 1)
        clickUpMovementY = newMovementY
        moveDiff = 0
      }
    }

    // remove event listener after mouse up
    QAcontainer.removeEventListener('mouseup', handleMovementUp)
    QAcontainer.removeEventListener('mousemove', handleMove)
    QAcontainer.removeEventListener('touchend', handleMovementUp)
    QAcontainer.removeEventListener('touchmove', handleMove)
  }

  function moveToNextPage() {
    // 1. when moveDiff > (height of each page) * 0.3 => transition to next page
    // 2. also need to detect scrolling/touching direction.
    if (moveDirection === 'down') {
      currentPage += 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-totalSectionsHeight(0, currentPage - 1))
      newMovementY = -totalSectionsHeight(0, currentPage - 1)
      // prevent user need to scroll & touch, so here need to re-locate clickUpMovementY
      clickUpMovementY = newMovementY
    } else {
      currentPage -= 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-totalSectionsHeight(0, currentPage - 1))
      newMovementY = -totalSectionsHeight(0, currentPage - 1)
      // prevent user need to scroll & touch, so here need to re-locate clickUpMovementY
      clickUpMovementY = newMovementY
    }
  }

  // scroll limiter function
  function handleScrollWrapper(e) {
    if (scrollLimit !== true) {
      handleScroll(e)
      scrollLimit = true
    }
  }

  // scroll/wheel event handler setting
  function handleScroll(e) {
    setTimeout(() => {
      scrollLimit = false
    }, 100)

    if (!scrollLimit) {
      updateOverflowInfo()

      if (e.deltaY > 0) {
        moveDirection = 'down'
      } else {
        moveDirection = 'up'
      }

      if (checkScrollOverflowSection() === true && validToScroll) {
        if (currentPage == $QAFinalPage) {
          scrollSpeed = 80
        } else {
          scrollSpeed = 30
        }
        clickUpMovementY = newMovementY + (moveDirection == 'down' ? -scrollSpeed : scrollSpeed)
        newMovementY = newMovementY + (moveDirection == 'down' ? -scrollSpeed : scrollSpeed)
        progress.set(newMovementY, { duration: 200, easing: linear })
      } else if (checkScrollOverflowSection() === false && validToScroll) {
        validToScroll = false
        scrollToNextPage()
      } else if (checkScrollOverflowSection() === 'static') {
        // do nothing
      }
    }
  }

  // the function let qa-container scroll to next page
  function scrollToNextPage() {
    if (moveDirection === 'down') {
      currentPage += 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-totalSectionsHeight(0, currentPage - 1), { duration: 1000 })
      newMovementY = -totalSectionsHeight(0, currentPage - 1)
      clickUpMovementY = newMovementY

      // the timer is to prevent excution of continuous scrollToNextPage
      setTimeout(() => {
        validToScroll = true
      }, 1300)
    } else if (moveDirection === 'up') {
      currentPage -= 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-totalSectionsHeight(0, currentPage - 1), { duration: 1000 })
      newMovementY = -totalSectionsHeight(0, currentPage - 1)
      clickUpMovementY = newMovementY

      // the timer is to prevent excution of continuous scrollToNextPage
      setTimeout(() => {
        validToScroll = true
      }, 1300)
    }
  }

  // the function check if the situation can scroll (the situation like if you move in the first page, you can't scroll on previous page)
  function isOnQAsectionsTopOrEnd() {
    if ((moveDirection === 'up' && currentPage === 1) || (moveDirection === 'down' && currentPage === $QAFinalPage)) {
      return true
    } else {
      return false
    }
  }

  //check overflow explain content
  function checkOverflowSection() {
    // crazy logic code ...
    if (moveOverflowDiff < overflowHeight && moveDirection === 'down') {
      if (currentPage === $QAFinalPage) {
        return true
      } else {
        return !isOnQAsectionsTopOrEnd()
      }
    } else if (moveOverflowDiff > overflowHeight && moveDirection === 'down') {
      return false
    } else if (moveOverflowDiff < overflowHeight && moveDirection === 'up') {
      if (newMovementY >= 0 && currentPage === 1) {
        return false
      } else if (newMovementY >= 0 && currentPage !== 1) {
        return true
      } else if (newMovementY > -$QASectionsHeight[currentPage - 1] && currentPage === 1) {
        return true
      } else if (newMovementY > -totalSectionsHeight(0, currentPage - 1) && currentPage !== 1) {
        return false
      } else if (newMovementY < -totalSectionsHeight(0, currentPage - 1) && currentPage !== 1) {
        return true
      }
    } else if (moveOverflowDiff > overflowHeight && moveDirection === 'up') {
      return !isOnQAsectionsTopOrEnd()
    }
  }

  // scroll overflow checker
  function checkScrollOverflowSection() {
    // crazy logic code ...
    if (currentPage === 1 && moveDirection === 'up') {
      if (newMovementY >= 0) {
        return 'static'
      } else if (moveOverflowDiff < overflowHeight) {
        return true
      } else if (moveOverflowDiff > overflowHeight) {
        return true
      }
    } else if (moveDirection === 'down' && currentPage < $QAProgress) {
      if (moveOverflowDiff === overflowHeight) {
        return false
      } else if (moveOverflowDiff < overflowHeight) {
        return true
      } else if (moveOverflowDiff > overflowHeight) {
        return false
      }
    } else if (currentPage !== 1 && moveDirection === 'up') {
      if (newMovementY < -totalSectionsHeight(0, currentPage - 1)) {
        return true
      } else if (newMovementY >= -totalSectionsHeight(0, currentPage - 1)) {
        return false
      }
    } else if (moveOverflowDiff < overflowHeight && moveDirection === 'down' && currentPage === $QAFinalPage) {
      return true
    }
  }

  // get selected section height
  function totalSectionsHeight(start, end) {
    const totalHeight = $QASectionsHeight.slice(start, end).reduce((a, b) => a + b, 0)
    return totalHeight
  }

  // update overflow value
  function updateOverflowInfo() {
    overflowHeight = Math.abs(totalSectionsHeight(currentPage - 1, currentPage)) - windowHeight
    moveOverflowDiff = Math.abs(newMovementY) - Math.abs(totalSectionsHeight(0, currentPage - 1))
  }
</script>

{#if $ContentDataStore}
  <div
    class=""
    use:cssVariables={{ transleteY }}
    id="qa-container"
    on:mousedown|stopPropagation={handleMovementDown}
    on:touchstart|stopPropagation|passive={handleMovementDown}
    on:wheel|stopPropagation|passive={handleScrollWrapper}
  >
    {#each $ContentDataStore.question_sets as { question_number }, i}
      <div
        class="qa-section"
        id={`qa-no-` + question_number}
        style="display: {i === 0 ? 'block' : 'none'}; height: {windowHeight}px;"
      >
        <QATemplate {maxQuestion} questNumber={i + 1} />
      </div>
    {/each}

    <div
      class="qa-section basic-p-container "
      id="qa-no-{$ContentDataStore.question_sets.length + 1}"
      style="display: none; height: auto;"
    >
      <div class="relative pt-16 h-auto">
        {#if $isMobile}
          <FinalCardBackground />
        {/if}
        <div class="QA-wrapper h-full rounded-2xl border-4 border-black bg-white mx-auto z-10">
          <div class="w-full">
            <AnswerHeader questNumber="0" finalPage={true} maxQuestion={null} />
            <div
              class="gtm-track bg-black text-xl sm:text-3xl tracking-widest sm:tracking-widesttt text-white text-center py-4 sm:mx-10"
              data-gtm-category={$ContentDataStore.project_name}
              data-gtm-label=""
              id="end-card"
            >
              共答對了{$RightAnswerCalc}題
            </div>
            <img
              class="mt-3 mb-3 sm:mb-6 px-3 mx-auto sm:px-10"
              src={$ContentDataStore.ending_image_url}
              alt="ending"
            />
          </div>
        </div>
      </div>
      <div class="pt-6 px-6 bg-white sm:py-10 mb-6 sm:mb-0 ">
        <BasicParagraphs sectionName="ending" />
      </div>
      <div class="relative bg-white pb-16">
        {#if $isMobile}
          <div class="absolute overflow-hidden" style="min-height: 200px; max-height: 220px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="100vw" viewBox="0 0 320.5 211">
              <path d="M320,0H102L0,102V211H320Z" style="fill:{$ThemeStore[themeNum][1]};fill-rule:evenodd" />
              <path d="M216,210.5A104.52,104.52,0,0,1,320.5,106V210.5Z" style="fill:{$ThemeStore[themeNum][2]}" />
            </svg>
          </div>
          <div class="absolute right-0" style="top: -77px;">
            <svg width="76" height="77" viewBox="0 0 76 77" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 77L76 -3.32207e-06L76 77L0 77Z" fill={$ThemeStore[themeNum][0]} />
            </svg>
          </div>
        {:else}
          <div class="absolute overflow-hidden" style="min-height: 160px; max-height: 180px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="100vw" viewBox="0 0 1440 310">
              <path d="M1440,0H180L0,180V310H1440Z" style="fill:{$ThemeStore[themeNum][1]};fill-rule:evenodd" />
              <path d="M1200,309A240,240,0,0,1,1440,69V309Z" style="fill:{$ThemeStore[themeNum][2]}" /></svg>
          </div>
          <div class="absolute right-0" style="top: -136px;">
            <svg width="135" height="136" viewBox="0 0 135 136" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 136L135 -2.11598e-05L135 136L0 136Z" fill={$ThemeStore[themeNum][0]} />
            </svg>
          </div>
        {/if}
        <h2 class="relative text-center text-white text-3xl pt-12">推薦文章</h2>
        <ArticleList projectName={$ContentDataStore.project_name} articleData={$ContentDataStore.read_more_articles} />
        {#if $ContentDataStore.final_shared_text}
          <div
            class="text-center font-bold text-lg sm:text-2xl mx-auto px-8 sm:px-12 pb-3 sm:p-0"
            style="max-width: 530px"
          >
            {@html $ContentDataStore.final_shared_text}
          </div>
        {/if}
        <SocialBoxInArticle shareUrl={$ContentDataStore.article_url} />
      </div>
      <div class="text-center pb-20 px-6 bg-white" style="word-break: keep-all;">
        <div>製作團隊｜{$ContentDataStore.team}</div>
        <div class="pt-2">核稿編輯｜{$ContentDataStore.sub_editor}</div>
      </div>

      <div style="transform: translateY(70px);">
        <Footer />
      </div>
    </div>
  </div>
{/if}
