<style>
  #qa-container {
    height: 100vh;
    transform: translate3d(0, calc(var(--transleteY) * 1px), 0);
  }
  .qa-section {
    width: 100%;
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
    console.log('click down')

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

    console.log(currentPage)
    console.log('click up')
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

    console.log('scroll', moveOverflowDiff, overflowHeight)
    console.log(checkScrollOverflowSection())
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
      return !isOnQAsectionsTopOrEnd()
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
        class="qa-section bg-white"
        id={`qa-no-` + question_number}
        style="display: {i === 0 ? 'block' : 'none'}; height: {windowHeight}px;"
      >
        <div class="py-6 h-full">
          <QATemplate {maxQuestion} questNumber={i + 1} />
        </div>
      </div>
    {/each}
    <div
      class="qa-section basic-p-container bg-white "
      id="qa-no-{$ContentDataStore.question_sets.length + 1}"
      style="display: none; height: {windowHeight}px;"
    >
      <p>你一共答對了 {$RightAnswerCalc} 題</p>
      <BasicParagraphs sectionName="ending" />
      <Footer />
    </div>
  </div>
{/if}
