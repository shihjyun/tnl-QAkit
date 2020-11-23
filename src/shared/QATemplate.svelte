<style>
  .noselect {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
  }
</style>

<script>
  import {
    QAFinalPage,
    QASectionsHeight,
    QAProgress,
    RightAnswerCalc,
    QAProgressArray,
  } from '../stores/QAStatusStore.js'
  import { changeCardSectionHeight, getAllSectionsHeight } from '../utils/helper.js'
  import AnswerMessage from './AnswerMessage.svelte'
  import AnswerHeader from './AnswerHeader.svelte'
  import ContentDataStore from '../stores/ContentDataStore.js'

  export let questNumber
  export let maxQuestion

  let explainStatus, QASet, Answers
  let answerType = 'answer-normal'
  let userHasClickedAnswer = false

  // check store has fetched content data from GCS
  $: if ($ContentDataStore) {
    QASet = $ContentDataStore['question_sets'][questNumber - 1]
  }

  function checkAnswer(e) {
    const selectedAnswer = e.target.dataset.correct
    Answers = e.target.parentElement.children

    // if user's clicked answer is correct:
    // 1. apply correct style to each answer
    // 2. show corresponded explain text to user
    // 3. add accumulated answer number to QA info
    if (selectedAnswer == 1) {
      userHasClickedAnswer = true
      explainStatus = 'explain_correct'
      e.target.classList.add('answer-correct')
      RightAnswerCalc.update(() => $RightAnswerCalc + 1)
      // update progress array
      QAProgressArray.update((currentData) => {
        let tmpArray = currentData
        tmpArray[questNumber - 1].status = 'correct'
        return tmpArray
      })
    } else {
      e.target.classList.add('answer-wrong')
      userHasClickedAnswer = true
      explainStatus = 'explain_wrong'
      // update progress array
      QAProgressArray.update((currentData) => {
        let tmpArray = currentData
        tmpArray[questNumber - 1].status = 'wrong'
        return tmpArray
      })
    }

    // handle each answer style
    for (let i = 0; i < Answers.length; i++) {
      if (Answers[i].dataset.correct == 1) {
        Answers[i].classList.remove('answer-hover')
        Answers[i].classList.remove('answer-normal')
        Answers[i].classList.add('answer-correct')
      } else {
        Answers[i].style.opacity = 0.3
        Answers[i].classList.remove('answer-hover')
      }
    }

    // unlock next question card
    document.getElementById('qa-no-' + (questNumber + 1)).style.display = 'block'
    QAFinalPage.update(() => questNumber + 1)

    // change section height if expain text is too long
    setTimeout(() => {
      changeCardSectionHeight(questNumber)
      QASectionsHeight.update(() => getAllSectionsHeight())
    }, 200)

    // update question progress
    QAProgress.update(() => questNumber + 1)
  }

  // remove event listener when user clicked
  $: if (userHasClickedAnswer) {
    for (let i = 0; i < Answers.length; i++) {
      Answers[i].removeEventListener('click', checkAnswer)
    }
  }
</script>

{#if $ContentDataStore}
  <div class="QA-wrapper rounded-2xl border-4 border-black mx-auto">
    <div class="w-full">
      <AnswerHeader {questNumber} {maxQuestion} />
      <div class="noselect QA-question-font py-2 px-3 mt-2">{QASet.question}</div>
      <div class="mt-8">
        {#each QASet.answer as { discription, correct, i }}
          <div
            class="{answerType} rounded-2xl py-3 px-3 mb-3 cursor-pointer mx-3 answer-hover"
            on:click={checkAnswer}
            data-correct={correct}
            answer-index={i}
          >
            {discription}
          </div>
        {/each}
      </div>
      {#if userHasClickedAnswer}
        <AnswerMessage {explainStatus} />
        <div class="noselect text-left text-base border-b-2 border-black pt-6 pb-6 mx-3">
          {@html QASet[explainStatus]}
        </div>
        <div class="text-center text-xs my-2">下一題</div>
      {/if}
    </div>
  </div>
{/if}
