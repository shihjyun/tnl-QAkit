<style>
  .arrow-svg {
    height: 276px;
    transform: translateX(-50%);
    /* animation: arrow-animation 2s linear infinite; */
  }
  .arrow {
    width: 100%;
    position: absolute;
    top: 15px;
  }
  @keyframes arrow-animation {
    0% {
      clip-path: inset(0px 0px 276px 0px);
    }

    60% {
      clip-path: inset(0px 0px 220px 0px);
    }

    100% {
      clip-path: inset(0px 0px 0px 0px);
    }
  }
  .animation {
    position: absolute;
    top: 25px;
    width: 100%;
    height: 100%;
    background-size: 4px;
  }

  .round {
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 100px;
    border: 2px solid #c9c9c9;
    animation: shock-wave ease infinite;
    transform: translateX(-50%) translateY(-50%);
  }

  .round-circle {
    animation-delay: 0.3s;
    animation-duration: 2s;
  }

  .round-circle2 {
    animation-delay: 0.6s;
    animation-duration: 2s;
  }
  .round-circle3 {
    animation-delay: 0.9s;
    animation-duration: 2s;
  }

  @keyframes shock-wave {
    0% {
      width: 0;
      height: 0;
      opacity: 1;
    }
    60% {
      opacity: 1;
    }
    100% {
      border-color: #e9e9e9;
      width: 180px;
      height: 180px;
      opacity: 0;
    }
  }
</style>

<script>
  /* your styles go here */
</script>

<div class="animation">
  <div class="round round-circle" />
  <div class="round round-circle2" />
  <div class="round round-circle3" />
</div>
<div class="arrow">
  <svg class="arrow-svg" viewBox="0 0 219 349" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M109.996 0.5C116.352 0.5 121.5 5.64835 121.5 12.0037C121.5 18.3512 116.345 23.5 109.996 23.5C103.648 23.5 98.5 18.3589 98.5 12.0037C98.5 5.64814 103.649 0.5 109.996 0.5Z"
      fill="black"
      stroke="black"
    />
    <mask id="path-2-inside-1" fill="white">
      <path
        d="M123.049 58H96.1542V297.099L19.9999 220.963L0.885254 239.895L109.601 348.61L218.317 239.895L199.184 220.963L123.047 297.099V12"
      />
    </mask>
    <path
      d="M123.049 58H96.1542V297.099L19.9999 220.963L0.885254 239.895L109.601 348.61L218.317 239.895L199.184 220.963L123.047 297.099V12"
      fill="black"
    />
    <path
      d="M96.1542 58V57H95.1542V58H96.1542ZM96.1542 297.099L95.4472 297.806L97.1542 299.512V297.099H96.1542ZM19.9999 220.963L20.7069 220.256L20.0032 219.552L19.2962 220.252L19.9999 220.963ZM0.885254 239.895L0.181551 239.184L-0.532364 239.891L0.178147 240.602L0.885254 239.895ZM109.601 348.61L108.893 349.317L109.601 350.024L110.308 349.317L109.601 348.61ZM218.317 239.895L219.024 240.602L219.735 239.891L219.02 239.184L218.317 239.895ZM199.184 220.963L199.887 220.252L199.18 219.552L198.477 220.256L199.184 220.963ZM123.047 297.099H122.047V299.513L123.755 297.806L123.047 297.099ZM123.049 57H96.1542V59H123.049V57ZM95.1542 58V297.099H97.1542V58H95.1542ZM96.8612 296.392L20.7069 220.256L19.2928 221.67L95.4472 297.806L96.8612 296.392ZM19.2962 220.252L0.181551 239.184L1.58896 240.605L20.7036 221.673L19.2962 220.252ZM0.178147 240.602L108.893 349.317L110.308 347.903L1.59236 239.188L0.178147 240.602ZM110.308 349.317L219.024 240.602L217.61 239.188L108.893 347.903L110.308 349.317ZM219.02 239.184L199.887 220.252L198.481 221.674L217.613 240.605L219.02 239.184ZM198.477 220.256L122.34 296.392L123.755 297.806L199.891 221.67L198.477 220.256ZM124.047 297.099V12H122.047V297.099H124.047Z"
      fill="black"
      mask="url(#path-2-inside-1)"
    />
  </svg>
</div>
