<style>
  .QA-wrapper {
    max-width: 560px;
  }

  .answer-normal {
    background-color: none;
  }

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
  import { QAFinalPage, QASectionsHeight, QAProgress } from '../stores/QAStatusStore.js'
  import { changeCardSectionHeight, getAllSectionsHeight } from '../utils/helper.js'

  export let questNumber

  let explainStatus
  let userHasClickedAnswer = false
  const QASet = {
    question: '今天是星期幾？',
    answer: [
      { discription: '星期一', correct: 1 },
      { discription: '星期二', correct: 0 },
      { discription: '星期三', correct: 0 },
    ],
    explainCorrect: '沒錯！今天是星期一！',
    explainWrong:
      '從人們從事的行為是否具有風險判斷 依據先前對HIV傳染途徑的描述，並非只有特定身份的人才會感染愛滋，必須從人們從事的行為是否具有風險判斷 感染者年齡趨勢年輕化 台灣近年的感染者年齡趨勢為年輕化，以15-34歲為大宗 目前已發明「事前預防性投藥｜ PrEP 目前已發明「事前預防性投藥」｜以15-34歲為大宗 目前已發明「事前預防性投藥｜ PrEP 目前已發明「事前預防性投藥」｜ 必須從人們從事的行為是否具有風險判斷 感染者年齡趨勢年輕化 台灣近年的感染者年齡趨勢為年輕化，以15-34歲為大宗 目前已發明「事前預防性投藥｜ PrEP 目前已發明「事前預防性投藥」｜以15-34歲為大宗 目前已發明「事前預防性投藥｜ PrEP 目前已發明「事前預防性投藥」｜  ',
  }

  async function checkAnswer(e) {
    const selectedAnswer = e.target.dataset.correct
    const Answers = e.target.parentElement.children
    // handle right and wrong answer
    for (let Answer of Answers) {
      if (Answer.dataset.correct == 1) {
        Answer.classList.add('answer-correct')
      } else {
        Answer.classList.add('answer-wrong')
      }
    }

    // handle explain zone
    if (selectedAnswer == 1) {
      userHasClickedAnswer = true
      explainStatus = 'explainCorrect'
    } else {
      userHasClickedAnswer = true
      explainStatus = 'explainWrong'
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
</script>

<div class="QA-wrapper mx-auto py-10">
  <div class="w-full border border-gray-100 shadow">
    <div class="noselect text-center py-5">問題：{QASet.question}</div>
    <div class="flex justify-around">
      {#each QASet.answer as { discription, correct, i }}
        <span
          class="border border-gray-200 py-3 px-3 mb-3 cursor-pointer"
          on:click|stopPropagation={checkAnswer}
          data-correct={correct}
          answer-index={i}
        >{discription}</span>
      {/each}
    </div>
    {#if userHasClickedAnswer}
      <div class="noselect text-left text-4xl pt-6 pb-3 ">{QASet[explainStatus]}</div>
    {/if}
  </div>
</div>
