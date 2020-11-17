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
  import { cubicOut } from 'svelte/easing'
  import QATemplate from './QATemplate.svelte'

  // intersection observer setting
  let isOnQAsectionsTopOrEnd = true

  $: {
    if ((moveDirection === 'up' && currentState === 1) || (moveDirection === 'down' && currentState === 5)) {
      isOnQAsectionsTopOrEnd = true
    } else {
      isOnQAsectionsTopOrEnd = false
    }
  }

  // tween animation setting
  const progress = tweened(0, {
    duration: 400,
    easing: cubicOut,
  })

  function moveToNextPage() {
    // 1. moveDiff > (height of each page) * 0.3 => transition to next page
    // 2. there's also need to detect scrolling/touching direction.
    if (moveDirection === 'down') {
      progressSettingValue = -windowHeight - moveDiff
      currentState += 1
    } else {
      progressSettingValue = windowHeight - moveDiff
      currentState -= 1
    }
    progress.set(0, { duration: 0 })
    progress.set(progressSettingValue)
  }

  // movement handler initial setting variables
  let currentState = 1
  let mouseDown = false
  let isMoving = false
  let windowHeight = window.innerHeight
  let movementDownY = 0,
    moveY = 0,
    moveDiff = 0,
    newMovementY = 0,
    progressSettingValue = 0

  $: moveDirection = moveDiff < 0 ? 'down' : 'up'

  $: transleteY = newMovementY + moveDiff + $progress

  function handleMovementDown(e) {
    const QAcontainer = document.getElementById('qa-container')
    mouseDown = true
    movementDownY = $isMobile ? e.touches[0].clientY : e.clientY
    console.log('click down')

    // add mousemove, mouseup event to `qa-container`
    QAcontainer.addEventListener('mousemove', handleMove)
    QAcontainer.addEventListener('mouseup', handleMovementUp)
    QAcontainer.addEventListener('touchmove', handleMove, { passive: true })
    QAcontainer.addEventListener('touchend', handleMovementUp)
  }

  function handleMove(e) {
    e.stopPropagation()
    if (mouseDown) {
      isMoving = true
      moveY = $isMobile ? e.touches[0].clientY : e.clientY
      moveDiff = moveY - movementDownY
    }
  }
  function handleMovementUp(e) {
    e.stopPropagation()
    const QAcontainer = document.getElementById('qa-container')

    // reset setting varialbes when movement ending
    isMoving = false
    mouseDown = false
    moveY = 0
    movementDownY = 0
    newMovementY = transleteY

    // remove event listener after move
    QAcontainer.removeEventListener('mouseup', handleMovementUp)
    QAcontainer.removeEventListener('mousemove', handleMove)
    QAcontainer.removeEventListener('touchend', handleMovementUp)
    QAcontainer.removeEventListener('touchmove', handleMove)
    console.log(moveDiff)

    // mouseup action
    if (Math.abs(moveDiff) > windowHeight * 0.1 && !isOnQAsectionsTopOrEnd) {
      console.log('object')
      moveToNextPage()
      moveDiff = 0
    } else {
      progress.set(0, { duration: 0 })
      progress.set(-moveDiff)
      moveDiff = 0
    }

    console.log('click up')
  }

  // css helper
</script>

<div
  class=""
  use:cssVariables={{ transleteY }}
  id="qa-container"
  on:mousedown|stopPropagation={handleMovementDown}
  on:touchstart|stopPropagation|passive={handleMovementDown}
>
  {#each [1, 2, 3, 4] as QANumber}
    <div class="qa-section bg-green-200 border border-b border-black" id={`qa-no-` + QANumber}>
      <QATemplate />
    </div>
  {/each}
  <div class="qa-section bg-red-200 border border-b border-black" id="qa-end">end</div>
</div>
