<style>
  div {
    border-bottom: 2px solid rgba(228, 228, 228, 0.3);
  }
  div > span {
    letter-spacing: 0.3rem;
  }
</style>

<script>
  export let explainStatus
</script>

{#if explainStatus === 'explain_correct'}
  <div class="flex justify-between items-center mx-3 mt-8 pb-2">
    <span class="mx-3">
      <svg width="22px" height="22px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path
          d="M20.7,5.8A10.87,10.87,0,0,0,18,2.5,10.7,10.7,0,0,0,11,0,11,11,0,0,0,0,11a10.7,10.7,0,0,0,2.5,7,11.8,11.8,0,0,0,3.2,2.7A11.86,11.86,0,0,0,11,22a11.12,11.12,0,0,0,5.2-1.3,11,11,0,0,0,4.4-4.4,11.65,11.65,0,0,0,.1-10.5Z"
          style="fill:#1ad71a"
        />
        <path
          d="M9.7,16.8l8.2-8.2a.67.67,0,0,0,0-1l-1-1a.67.67,0,0,0-1,0L9.2,13.3,6.1,10.2a.67.67,0,0,0-1,0l-1,1a.67.67,0,0,0,0,1l4.6,4.6A.67.67,0,0,0,9.7,16.8Z"
          style="fill:#fff"
        /></svg>
    </span>
    <span class="text-lg font-black">答對了</span>
    <span class="mx-3">
      <svg width="22px" height="22px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path
          d="M20.7,5.8A10.87,10.87,0,0,0,18,2.5,10.7,10.7,0,0,0,11,0,11,11,0,0,0,0,11a10.7,10.7,0,0,0,2.5,7,11.8,11.8,0,0,0,3.2,2.7A11.86,11.86,0,0,0,11,22a11.12,11.12,0,0,0,5.2-1.3,11,11,0,0,0,4.4-4.4,11.65,11.65,0,0,0,.1-10.5Z"
          style="fill:#1ad71a"
        />
        <path
          d="M9.7,16.8l8.2-8.2a.67.67,0,0,0,0-1l-1-1a.67.67,0,0,0-1,0L9.2,13.3,6.1,10.2a.67.67,0,0,0-1,0l-1,1a.67.67,0,0,0,0,1l4.6,4.6A.67.67,0,0,0,9.7,16.8Z"
          style="fill:#fff"
        /></svg>
    </span>
  </div>
{:else}
  <div class="flex justify-between items-center mx-3 mt-8 pb-2">
    <span class="mx-3">
      <svg width="22px" height="22px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><circle
          cx="11"
          cy="11"
          r="11"
          style="fill:#dd4b4b"
        />
        <path
          d="M6,7.2,7.2,6A.61.61,0,0,1,8,6l3,3,3-3a.61.61,0,0,1,.8,0L16,7.2A.61.61,0,0,1,16,8l-3,3,3,3a.61.61,0,0,1,0,.8L14.8,16a.61.61,0,0,1-.8,0l-3-3L8,16a.61.61,0,0,1-.8,0L6,14.8A.61.61,0,0,1,6,14l3-3L6,8A.61.61,0,0,1,6,7.2Z"
          style="fill:#fff"
        /></svg>
    </span>
    <span class="text-lg font-black">答錯了</span>
    <span class="mx-3">
      <svg width="22px" height="22px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><circle
          cx="11"
          cy="11"
          r="11"
          style="fill:#dd4b4b"
        />
        <path
          d="M6,7.2,7.2,6A.61.61,0,0,1,8,6l3,3,3-3a.61.61,0,0,1,.8,0L16,7.2A.61.61,0,0,1,16,8l-3,3,3,3a.61.61,0,0,1,0,.8L14.8,16a.61.61,0,0,1-.8,0l-3-3L8,16a.61.61,0,0,1-.8,0L6,14.8A.61.61,0,0,1,6,14l3-3L6,8A.61.61,0,0,1,6,7.2Z"
          style="fill:#fff"
        /></svg>
    </span>
  </div>
{/if}
