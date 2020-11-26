<style>
  #qa-container {
    height: 100vh;
    transform: translate3d(0, calc(var(--transleteY) * 1px), 0);
  }
  .qa-section {
    width: 100%;
  }

  img {
    width: 15rem;
    height: 15rem;
    object-position: 50% 0;
    object-fit: cover;
  }

  @media (min-width: 640px) {
    img {
      width: 100%;
      height: 100%;
    }
  }
</style>

<script>
  import { cssVariables, getAllSectionsHeight } from '../utils/helper.js'
  import { isMobile } from '../stores/DeviceDetectorStore.js'
  import { tweened } from 'svelte/motion'
  import { quintOut } from 'svelte/easing'
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
  import TeamCreatorList from './TeamCreatorList.svelte'
  import AnswerHeader from './AnswerHeader.svelte'
  import FinalCardBackground from './FinalCardBackground.svelte'
  import ArticleList from './ArticleList.svelte'
  import SocialBoxInArticle from './SocialBoxInArticle.svelte'
  import ContentDataStore from '../stores/ContentDataStore.js'

  import QATemplate from './QATemplate.svelte'

  // set tweened animation store
  const progress = tweened(0, {
    duration: 800,
    easing: quintOut,
  })

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
    clickUpMovementY = newMovementY
  const pageChangeThreshold = 0.1

  // update QAsectionHeight initially
  QASectionsHeight.update(() => windowHeight)

  // detect click&toych direction
  $: moveDirection = moveDiff <= 0 ? 'down' : 'up'

  // y-coordinate that qa-container need to translate (just like normal scroll effect)
  $: transleteY = $progress

  // scroll-like movement initial setting variables
  let validToScroll = true // is wheel event fire now?

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
    }, 600)
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

  // scroll/wheel event handler setting
  function handleScroll(e) {
    updateOverflowInfo()

    if (e.deltaY > 0) {
      moveDirection = 'down'
    } else {
      moveDirection = 'up'
    }

    if (checkScrollOverflowSection() === true && validToScroll) {
      clickUpMovementY = newMovementY + (moveDirection == 'down' ? -30 : 30)
      newMovementY = newMovementY + (moveDirection == 'down' ? -30 : 30)
      progress.set(newMovementY, { duration: 100 })
    } else if (checkScrollOverflowSection() === false && validToScroll) {
      validToScroll = false
      scrollToNextPage()
    } else if (checkScrollOverflowSection() === 'static') {
      // do nothing
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
        return false
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
    on:wheel|stopPropagation|passive={handleScroll}
  >
    {#each $ContentDataStore.question_sets as { question_number }, i}
      <div
        class="qa-section"
        id={`qa-no-` + question_number}
        style="display: {i === 0 ? 'block' : 'none'}; height: {windowHeight}px;"
      >
        <div class="py-6 h-auto sm:h-full">
          <QATemplate {maxQuestion} questNumber={i + 1} />
        </div>
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
            <div class="bg-black text-white text-center py-4 sm:mx-10">共答對了 {$RightAnswerCalc} 題</div>
            <img
              class="mt-3 mb-6 mx-auto sm:px-10"
              src="https://image2.thenewslens.com/2017/11/713gr851wegi4tefb41afh337w4obc.jpg"
              alt=""
            />
          </div>
        </div>
      </div>
      <div class="pt-6 bg-white pb-6">
        <BasicParagraphs sectionName="ending" />
        <SocialBoxInArticle shareUrl={$ContentDataStore.article_url} />
      </div>
      <div class="relative bg-white pb-16">
        {#if $isMobile}
          <div class="absolute overflow-hidden" style="max-height: 400px;">
            <svg width="100vw" viewBox="0 0 320.5 420">
              <path d="M320,0H102L0,102V420H320Z" style="fill:#ba1d26;fill-rule:evenodd" />
              <path d="M216,419.5A104.49,104.49,0,0,1,320.5,315V419.5Z" style="fill:#ffba49" />
            </svg>
          </div>
          <div class="absolute right-0" style="top: -77px;">
            <svg width="76" height="77" viewBox="0 0 76 77" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 77L76 -3.32207e-06L76 77L0 77Z" fill="#FDC637" />
            </svg>
          </div>
        {:else}
          <div class="absolute overflow-hidden" style="max-height: 380px; min-height: 320px;">
            <svg width="100vw" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 420">
              <path d="M1440,0H280L0,279V420H1440Z" style="fill:#3699ff;fill-rule:evenodd" />
              <path d="M1160,420a280,280,0,0,1,280-280V420Z" style="fill:#ffc736" />/svg>
            </svg>
          </div>
          <div class="absolute right-0" style="top: -136px;">
            <svg width="135" height="136" viewBox="0 0 135 136" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 136L135 -2.11598e-05L135 136L0 136Z" fill="#1D4ABA" />
            </svg>
          </div>
        {/if}
        <h2 class="relative text-center text-white text-3xl pt-12">推薦文章</h2>
        <p class="relative text-center text-lg text-white font-normal pt-6 pb-2 px-6 mx-auto" style="max-width: 650px;">
          {$ContentDataStore.read_more_intro}
        </p>
        <ArticleList projectName={$ContentDataStore.project_name} articleData={$ContentDataStore.read_more_articles} />
        <SocialBoxInArticle shareUrl={$ContentDataStore.article_url} />
      </div>
      <Footer />
    </div>
  </div>
{/if}
