<script lang="ts">
  let { children } = $props();
</script>

{@render children()}

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
    background: #080604;
    color: #f6ead0;
  }
  :global(*) {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  :global(button:focus-visible) {
    outline: 2px solid #ffe066;
    outline-offset: 2px;
  }
</style>
