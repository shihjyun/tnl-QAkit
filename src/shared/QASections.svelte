<style>
  #qa-container {
    height: 100vh;
    transform: translate3d(0, calc(var(--transleteY) * 1px), 0);
  }
  .qa-section {
    width: 100%;
    height: 100vh;
  }
</style>

<script>
  import { cssVariables } from '../utils/helper.js'
  import { isMobile } from '../stores/DeviceDetectorStore.js'
  import { tweened } from 'svelte/motion'
  import { quintOut } from 'svelte/easing'
  import { onMount } from 'svelte'
  import { QAFinalPage } from '../stores/QAStatusStore.js'
  import QATemplate from './QATemplate.svelte'

  //

  let maxQuestion
  $: console.log('testing', $QAFinalPage)

  // set tweened animation store
  const progress = tweened(0, {
    duration: 800,
    easing: quintOut,
  })

  // click&touch movement handler initial setting variables
  let currentPage = 1 // the initail page when enter QA sections
  let mouseDown = false // true if user mousedown
  let isMoving = false // true if user click and move their mouse
  let windowHeight = window.innerHeight // screen height
  let movementDownY = 0, // the y-coordinate when user click down
    moveY = 0, // the y-coordinate when user move
    moveDiff = 0, // the distance that user move (movementDownY - moveY)
    newMovementY = 0 // the y-coordinate after user click up
  const pageChangeThreshold = 0.03

  // detect click&toych direction
  $: moveDirection = moveDiff < 0 ? 'down' : 'up'

  // y-coordinate that qa-container need to translate (just like normal scroll effect)
  $: transleteY = $progress

  // scroll-like movement initial setting variables
  let scrollingNow = false // is wheel event fire now?
  let userCanScroll = false // can user scroll on the start&end page?
  // reactive expression to fire scrollToNextPage effect
  $: if (scrollingNow && !userCanScroll) {
    scrollToNextPage()
  }

  $: console.log(currentPage)

  onMount(() => {
    // final page equal to the number of qa-container's children
    maxQuestion = document.querySelectorAll('#qa-container > div').length
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
      moveDiff = (moveY - movementDownY) * 0.3 // moveDiff * 0.3 can prevent decrease distance that user move
      newMovementY = -(currentPage - 1) * windowHeight + moveDiff
      progress.set(newMovementY + moveDiff, { duration: 0 }) // update the latest coordinate to progress store
    }

    console.log(currentPage, $QAFinalPage)
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

    // mouseup action
    if (Math.abs(moveDiff) > windowHeight * pageChangeThreshold && !isOnQAsectionsTopOrEnd()) {
      moveToNextPage()
      moveDiff = 0
    } else {
      // improve user experience when scroll over the valid zone
      progress.set(newMovementY, { duration: 0 })
      progress.set(-(currentPage - 1) * windowHeight)
      newMovementY = -(currentPage - 1) * windowHeight
      moveDiff = 0
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
      progress.set(-(currentPage - 1) * windowHeight)
      newMovementY = -(currentPage - 1) * windowHeight
    } else {
      currentPage -= 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-(currentPage - 1) * windowHeight)
      newMovementY = -(currentPage - 1) * windowHeight
    }
  }

  // scroll/wheel event handler setting
  function handleScroll(e) {
    scrollingNow = true
    if (e.deltaY > 0) {
      moveDirection = 'down'
    } else {
      moveDirection = 'up'
    }
    userCanScroll = isOnQAsectionsTopOrEnd()
  }

  // the function let qa-container scroll to next page
  function scrollToNextPage() {
    if (moveDirection === 'down') {
      currentPage += 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-(currentPage - 1) * windowHeight, { duration: 1000 })
      newMovementY = -(currentPage - 1) * windowHeight
    } else if (moveDirection === 'up') {
      currentPage -= 1
      progress.set(newMovementY, { duration: 0 })
      progress.set(-(currentPage - 1) * windowHeight, { duration: 1000 })
      newMovementY = -(currentPage - 1) * windowHeight
    }
    // the timer is to prevent excution of continuous scrollToNextPage
    setTimeout(() => {
      scrollingNow = false
    }, 1400)
  }

  // the function check if the situation can scroll (the situation like if you move in the first page, you can't scroll on previous page)
  function isOnQAsectionsTopOrEnd() {
    if ((moveDirection === 'up' && currentPage === 1) || (moveDirection === 'down' && currentPage === $QAFinalPage)) {
      return true
    } else {
      return false
    }
  }
</script>

<div
  class=""
  use:cssVariables={{ transleteY }}
  id="qa-container"
  on:mousedown|stopPropagation={handleMovementDown}
  on:touchstart|stopPropagation|passive={handleMovementDown}
  on:wheel|stopPropagation|passive={handleScroll}
>
  {#each [1, 2, 3, 4] as QANumber, i}
    <div
      class="qa-section bg-green-200 border border-b border-black"
      id={`qa-no-` + QANumber}
      style="display: {i === 0 ? 'block' : 'none'}"
    >
      <QATemplate questNumber={i + 1} />
    </div>
  {/each}
  <div class="qa-section bg-red-200 border border-b border-black" id="qa-no-{maxQuestion}" style="display: none">
    end
  </div>
</div>
