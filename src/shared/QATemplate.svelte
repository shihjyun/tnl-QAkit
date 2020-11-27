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

  @media (min-width: 640px) {
    div[class*='width-desk'] {
      width: 68%;
    }
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
  import { isMobile } from '../stores/DeviceDetectorStore.js'

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
  <div class="h-auto-sp sm:h-{userHasClickedAnswer ? 'auto' : 'full'}-sp py-6 sm:pb-24 mx-3">
    <div class="QA-wrapper relative h-full rounded-2xl border-4 border-black bg-white mx-auto pb-0 sm:pb-4">
      {#if userHasClickedAnswer && !$isMobile}
        <div class="absolute w-3.5" style="bottom: 40px; right: 40px">
          <svg width="100%" viewBox="0 0 12 187" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.804 4.468V3.892L1.208 3.892V4.468L5.972 4.468L5.972 13.864L6.572 13.864L6.572 7.192C8.048 7.936 9.776 8.992 10.7 9.676L11.072 9.172C10.1 8.464 8.192 7.348 6.692 6.628L6.572 6.772V4.468L11.804 4.468ZM3.464 23.672C3.008 23.312 2.108 22.784 1.412 22.436L1.076 22.844C1.784 23.216 2.672 23.756 3.128 24.128L3.464 23.672ZM1.976 29.672C2.564 28.604 3.284 27.068 3.812 25.832L3.368 25.496C2.804 26.816 2.012 28.4 1.448 29.324L1.976 29.672ZM1.664 19.556C2.444 20 3.404 20.672 3.884 21.116L4.244 20.66C3.776 20.228 2.792 19.604 2.024 19.172L1.664 19.556ZM10.64 24.224H5.288L5.288 26.312C5.288 27.308 5.192 28.628 4.388 29.612C4.508 29.684 4.724 29.864 4.82 29.972C5.684 28.916 5.84 27.416 5.84 26.312L5.84 24.716H10.088V26.888C8.576 27.176 7.076 27.488 6.044 27.668L6.26 28.184C7.34 27.968 8.72 27.668 10.088 27.356L10.088 29.204C10.088 29.348 10.04 29.396 9.872 29.408C9.704 29.42 9.128 29.42 8.432 29.396C8.516 29.552 8.588 29.744 8.612 29.9C9.488 29.9 10.004 29.888 10.292 29.792C10.556 29.708 10.64 29.552 10.64 29.192L10.64 24.224ZM6.428 25.928C7.448 26.06 8.732 26.384 9.44 26.66L9.596 26.18C8.912 25.892 7.616 25.616 6.596 25.508L6.428 25.928ZM5.948 19.964H10.028V20.924H7.652V22.724H5.948V19.964ZM10.028 22.724H8.168V21.38H10.028V22.724ZM10.58 22.724V19.472H5.408V22.724H4.076V24.608H4.628V23.216H11.312V24.608H11.864V22.724H10.58ZM2.54 58.636C2.564 58.288 2.576 57.94 2.576 57.64L2.576 57.184H5.624L5.624 58.636H2.54ZM5.624 55.24V56.692H2.576V55.24H5.624ZM6.176 54.724H2.036L2.036 57.64C2.036 58.864 1.94 60.424 1.124 61.576C1.244 61.636 1.472 61.828 1.556 61.924C2.132 61.144 2.384 60.112 2.492 59.128H5.624V61.06C5.624 61.24 5.576 61.288 5.384 61.288C5.228 61.3 4.64 61.3 3.944 61.276C4.028 61.444 4.1 61.672 4.148 61.816C5 61.816 5.516 61.816 5.804 61.708C6.092 61.612 6.176 61.444 6.176 61.072L6.176 54.724ZM10.328 61.036C10.328 61.216 10.268 61.264 10.076 61.276C9.884 61.288 9.212 61.288 8.42 61.276C8.504 61.432 8.612 61.672 8.648 61.84C9.584 61.84 10.148 61.828 10.484 61.732C10.784 61.624 10.892 61.456 10.892 61.024L10.892 54.448H10.328L10.328 61.036ZM8.444 54.844H7.904L7.904 59.74H8.444L8.444 54.844ZM3.2 51.196C3.668 51.736 4.184 52.492 4.4 52.972L4.952 52.744C4.712 52.264 4.184 51.52 3.704 50.992L3.2 51.196ZM8.78 52.972C9.164 52.432 9.596 51.748 9.944 51.16L9.344 50.932C9.068 51.532 8.564 52.396 8.144 52.972H1.208L1.208 53.512H11.78V52.972H8.78ZM8.72 68.948C8.528 68.432 8.048 67.58 7.604 66.956L7.088 67.172C7.52 67.808 7.988 68.66 8.168 69.2L8.72 68.948ZM3.644 67.04C3.104 67.916 2.06 68.936 1.112 69.572C1.208 69.668 1.364 69.896 1.436 70.028C2.468 69.32 3.56 68.24 4.196 67.244L3.644 67.04ZM3.848 69.716C3.152 71 2.036 72.26 0.944 73.088C1.064 73.196 1.256 73.472 1.316 73.592C1.82 73.184 2.324 72.68 2.792 72.14L2.792 77.876H3.368L3.368 71.432C3.74 70.94 4.088 70.424 4.364 69.908L3.848 69.716ZM8.396 76.928L8.396 73.46H11.24V72.908H8.396V69.872H11.624V69.32H4.628V69.872H7.808V72.908H5.06V73.46H7.808L7.808 76.928H4.292V77.48H11.936V76.928H8.396ZM11.804 84.468V83.892H1.208V84.468H5.972L5.972 93.864H6.572L6.572 87.192C8.048 87.936 9.776 88.992 10.7 89.676L11.072 89.172C10.1 88.464 8.192 87.348 6.692 86.628L6.572 86.772L6.572 84.468H11.804ZM1.088 103.996L1.088 104.632H11.96V103.996H1.088ZM10.712 118.784H7.448L7.448 117.704H10.712V118.784ZM10.712 120.356H7.448V119.264H10.712V120.356ZM10.712 121.928H7.448V120.812H10.712V121.928ZM6.908 117.224L6.908 122.408H11.264V117.224H8.912C9.044 116.9 9.164 116.504 9.284 116.132H11.816L11.816 115.64H6.404V116.132H8.72C8.636 116.48 8.516 116.888 8.408 117.224H6.908ZM9.584 122.96C10.268 123.404 11.096 124.088 11.492 124.58L11.924 124.268C11.504 123.812 10.688 123.128 9.98 122.708L9.584 122.96ZM7.928 122.696C7.436 123.284 6.632 123.848 5.864 124.22C5.984 124.304 6.2 124.52 6.26 124.616C7.028 124.184 7.904 123.5 8.432 122.852L7.928 122.696ZM5.132 117.104H2.42V116H5.132V117.104ZM5.132 118.688H2.42L2.42 117.56H5.132V118.688ZM5.684 115.532H1.892L1.892 119.156H5.684L5.684 115.532ZM8.3 125.072C6.608 125.072 5.168 124.964 4.088 124.436V122.624H6.284V122.132H4.088V120.656H6.488V120.164H1.088V120.656H3.56L3.56 124.124C3.128 123.8 2.768 123.392 2.492 122.852C2.552 122.372 2.6 121.892 2.624 121.424H2.084C2.036 122.912 1.784 124.64 1.028 125.528C1.172 125.612 1.352 125.78 1.436 125.888C1.916 125.312 2.216 124.448 2.384 123.512C3.524 125.276 5.504 125.6 8.3 125.6H11.756C11.792 125.432 11.9 125.192 11.996 125.072H8.3Z"
              fill="#CACACA"
            />
            <path d="M6 134L6 187" stroke="#E1E1E1" />
          </svg>
        </div>
      {/if}
      <div class="w-full">
        <AnswerHeader {questNumber} {maxQuestion} />
        <div class="flex items-center QA-question-font py-2 mx-3 sm:mx-10 mt-2">
          <div class="hidden sm:block">
            <svg width="106" height="139" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.856 0.0399995C9.088 0.0399995 10.184 0.256 11.144 0.688C12.104 1.12 12.912 1.704 13.568 2.44C14.224 3.176 14.72 4.032 15.056 5.008C15.408 5.984 15.584 7.008 15.584 8.08C15.584 9.104 15.432 10.096 15.128 11.056C14.824 12 14.368 12.848 13.76 13.6C13.168 14.336 12.432 14.944 11.552 15.424C10.672 15.904 9.656 16.176 8.504 16.24C9.32 16.256 10.04 16.352 10.664 16.528C11.288 16.72 11.872 16.92 12.416 17.128C12.976 17.352 13.528 17.552 14.072 17.728C14.616 17.904 15.2 17.992 15.824 17.992C16.048 17.992 16.312 17.96 16.616 17.896C16.936 17.848 17.272 17.72 17.624 17.512L17.696 17.56L18.032 18.232L18.008 18.328C17.64 18.792 17.192 19.184 16.664 19.504C16.136 19.824 15.544 19.984 14.888 19.984C14.344 19.984 13.784 19.856 13.208 19.6C12.648 19.36 12.056 19.088 11.432 18.784C10.808 18.496 10.16 18.224 9.488 17.968C8.816 17.728 8.112 17.608 7.376 17.608C6.752 17.608 6.144 17.712 5.552 17.92C4.976 18.128 4.552 18.352 4.28 18.592L4.208 18.568L3.944 17.632L3.968 17.56C4.32 17.32 4.792 17.056 5.384 16.768C5.976 16.48 6.616 16.312 7.304 16.264C6.12 16.248 5.08 16.024 4.184 15.592C3.288 15.16 2.536 14.584 1.928 13.864C1.336 13.128 0.888 12.28 0.584 11.32C0.28 10.36 0.128 9.344 0.128 8.272C0.128 7.136 0.304 6.072 0.656 5.08C1.008 4.072 1.512 3.2 2.168 2.464C2.824 1.712 3.632 1.12 4.592 0.688C5.552 0.256 6.64 0.0399995 7.856 0.0399995ZM7.832 14.272C8.616 14.272 9.312 14.112 9.92 13.792C10.544 13.456 11.064 13.016 11.48 12.472C11.896 11.912 12.216 11.264 12.44 10.528C12.664 9.776 12.776 8.976 12.776 8.128C12.776 7.264 12.656 6.464 12.416 5.728C12.192 4.976 11.856 4.328 11.408 3.784C10.976 3.24 10.448 2.816 9.824 2.512C9.2 2.192 8.496 2.032 7.712 2.032C6.944 2.032 6.264 2.184 5.672 2.488C5.08 2.792 4.584 3.216 4.184 3.76C3.784 4.304 3.48 4.952 3.272 5.704C3.064 6.44 2.96 7.24 2.96 8.104C2.96 9.048 3.08 9.904 3.32 10.672C3.56 11.424 3.896 12.072 4.328 12.616C4.76 13.144 5.272 13.552 5.864 13.84C6.456 14.128 7.112 14.272 7.832 14.272Z"
                fill="black"
              />
            </svg>
          </div>
          <div class="noselect ml-4">{QASet.question}</div>
        </div>
        <div class="mt-8">
          {#each QASet.answer as { discription, correct, i }}
            <div
              class="{answerType} rounded-2xl py-3 px-3 mb-3 mx-3 sm:mx-auto cursor-pointer answer-hover width-desk"
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
          <div class="noselect text-left text-base sm:border-none pt-6 pb-10 sm:pb-6 mx-3 sm:mx-auto width-desk">
            {@html QASet[explainStatus]}
            {#if QASet.explain_source}
              <p class="pt-3 sm:pt-5 text-sm" style="color: #515151">資料來源：{QASet.explain_source}</p>
            {/if}
          </div>

          {#if $isMobile}
            <div
              class="absolte flex justify-between items-center  bottom-0 w-full rounded-b-lg text-center bg-black py-4"
            >
              <div class="text-white text-center">
                <div>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.308 16.7923C9.89735 16.3826 9.89735 15.7179 10.308 15.3073C10.7176 14.8976 11.3823 14.8976 11.793 15.3073L16.0501 19.5653L20.3072 15.3073C20.7178 14.8976 21.3825 14.8976 21.7922 15.3073C22.2028 15.7179 22.2028 16.3826 21.7922 16.7923L16.7925 21.7929C16.3828 22.2026 15.7172 22.2026 15.3075 21.7929L10.308 16.7923ZM10.308 10.7923C9.89735 10.3826 9.89735 9.71788 10.308 9.30726C10.7176 8.89758 11.3823 8.89758 11.793 9.30726L16.0501 13.5653L20.3072 9.30726C20.7178 8.89758 21.3825 8.89758 21.7922 9.30726C22.2028 9.71788 22.2028 10.3826 21.7922 10.7923L16.7925 15.7929C16.3828 16.2026 15.7172 16.2026 15.3075 15.7929L10.308 10.7923Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <div class="inline-block">
                  {questNumber == maxQuestion ? '答題結束，下滑看結果' : '下滑，前往下一題'}
                </div>
                <div>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.308 16.7923C9.89735 16.3826 9.89735 15.7179 10.308 15.3073C10.7176 14.8976 11.3823 14.8976 11.793 15.3073L16.0501 19.5653L20.3072 15.3073C20.7178 14.8976 21.3825 14.8976 21.7922 15.3073C22.2028 15.7179 22.2028 16.3826 21.7922 16.7923L16.7925 21.7929C16.3828 22.2026 15.7172 22.2026 15.3075 21.7929L10.308 16.7923ZM10.308 10.7923C9.89735 10.3826 9.89735 9.71788 10.308 9.30726C10.7176 8.89758 11.3823 8.89758 11.793 9.30726L16.0501 13.5653L20.3072 9.30726C20.7178 8.89758 21.3825 8.89758 21.7922 9.30726C22.2028 9.71788 22.2028 10.3826 21.7922 10.7923L16.7925 15.7929C16.3828 16.2026 15.7172 16.2026 15.3075 15.7929L10.308 10.7923Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
