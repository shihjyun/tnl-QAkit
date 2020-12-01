<style>
  div[class*='progress'] {
    max-width: 400px;
  }

  @media (min-width: 640px) {
    div[class*='progress'] {
      width: 50%;
    }
  }
</style>

<script>
  import { QAProgressArray } from '../stores/QAStatusStore.js'
  export let questNumber
  export let maxQuestion
  export let finalPage = false

  function progressColorChecker(status) {
    if (status == 'correct') {
      return '#1AD71A'
    } else if (status == 'wrong') {
      return '#FF0000'
    } else if (status == 'unanswered') {
      return '#FFFFFF'
    }
  }
</script>

<div class="text-center {finalPage ? 'border-none' : 'border-b-2'} border-black mt-6 mb-2 pb-3 mx-3 sm:mx-10">
  <div class="flex justify-between items-center progress mx-auto">
    {#if $QAProgressArray}
      {#each $QAProgressArray as { question_number, status }}
        {#if +question_number == +questNumber}
          <div
            class="flex justify-center items-center rounded-full h-6 w-6 mx-2 border-2 border-black"
            style="opacity: {status === 'wrong' ? 0.3 : 1}"
          >
            <div
              class="rounded-full bg-black h-4 w-4"
              style="background-color: {status === 'unanswered' ? '#000000' : progressColorChecker(status)};"
            />
          </div>
        {:else}
          <div
            class="rounded-full h-4 w-4 mx-2 border-2 border-black"
            style="background-color: {progressColorChecker(status)}; opacity: {status === 'wrong' ? 0.3 : 1}"
          />
        {/if}
      {/each}
    {/if}
  </div>
</div>
{#if !finalPage}
  <div class="flex justify-between items-center mx-3 sm:mx-10 mt-1">
    <div class="sm:invisible">
      <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.856 0.0399995C9.088 0.0399995 10.184 0.256 11.144 0.688C12.104 1.12 12.912 1.704 13.568 2.44C14.224 3.176 14.72 4.032 15.056 5.008C15.408 5.984 15.584 7.008 15.584 8.08C15.584 9.104 15.432 10.096 15.128 11.056C14.824 12 14.368 12.848 13.76 13.6C13.168 14.336 12.432 14.944 11.552 15.424C10.672 15.904 9.656 16.176 8.504 16.24C9.32 16.256 10.04 16.352 10.664 16.528C11.288 16.72 11.872 16.92 12.416 17.128C12.976 17.352 13.528 17.552 14.072 17.728C14.616 17.904 15.2 17.992 15.824 17.992C16.048 17.992 16.312 17.96 16.616 17.896C16.936 17.848 17.272 17.72 17.624 17.512L17.696 17.56L18.032 18.232L18.008 18.328C17.64 18.792 17.192 19.184 16.664 19.504C16.136 19.824 15.544 19.984 14.888 19.984C14.344 19.984 13.784 19.856 13.208 19.6C12.648 19.36 12.056 19.088 11.432 18.784C10.808 18.496 10.16 18.224 9.488 17.968C8.816 17.728 8.112 17.608 7.376 17.608C6.752 17.608 6.144 17.712 5.552 17.92C4.976 18.128 4.552 18.352 4.28 18.592L4.208 18.568L3.944 17.632L3.968 17.56C4.32 17.32 4.792 17.056 5.384 16.768C5.976 16.48 6.616 16.312 7.304 16.264C6.12 16.248 5.08 16.024 4.184 15.592C3.288 15.16 2.536 14.584 1.928 13.864C1.336 13.128 0.888 12.28 0.584 11.32C0.28 10.36 0.128 9.344 0.128 8.272C0.128 7.136 0.304 6.072 0.656 5.08C1.008 4.072 1.512 3.2 2.168 2.464C2.824 1.712 3.632 1.12 4.592 0.688C5.552 0.256 6.64 0.0399995 7.856 0.0399995ZM7.832 14.272C8.616 14.272 9.312 14.112 9.92 13.792C10.544 13.456 11.064 13.016 11.48 12.472C11.896 11.912 12.216 11.264 12.44 10.528C12.664 9.776 12.776 8.976 12.776 8.128C12.776 7.264 12.656 6.464 12.416 5.728C12.192 4.976 11.856 4.328 11.408 3.784C10.976 3.24 10.448 2.816 9.824 2.512C9.2 2.192 8.496 2.032 7.712 2.032C6.944 2.032 6.264 2.184 5.672 2.488C5.08 2.792 4.584 3.216 4.184 3.76C3.784 4.304 3.48 4.952 3.272 5.704C3.064 6.44 2.96 7.24 2.96 8.104C2.96 9.048 3.08 9.904 3.32 10.672C3.56 11.424 3.896 12.072 4.328 12.616C4.76 13.144 5.272 13.552 5.864 13.84C6.456 14.128 7.112 14.272 7.832 14.272Z"
          fill="black"
        />
      </svg>
    </div>
    <div class="bg-black">
      <span class="text-xs tracking-wider text-white mx-2 my-1">{questNumber}/{maxQuestion}</span>
    </div>
  </div>
{/if}
