<script lang="ts">
  import { Sprite } from "pixi-svelte";

  interface Props {
    width: number;
    height: number;
  }
  let { width, height }: Props = $props();
</script>

<Sprite key="background" x={0} y={0} {width} {height} />
