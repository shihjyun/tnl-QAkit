<style>
  .animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 500px;
    height: 500px;
    background-size: 4px;
  }

  .round {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 100px;
    border: 2px solid #000000;
    animation: shock-wave 4s ease 2s infinite;
    transform: translateX(-50%) translateY(-50%);
  }

  .round-circle {
    top: 200px;
    left: 200px;
    animation-delay: 8s;
    animation-duration: 2s;
  }

  .round-circle2 {
    top: 200px;
    left: 200px;
    animation-delay: 8.5s;
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
      width: 200px;
      height: 200px;
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
</div>
