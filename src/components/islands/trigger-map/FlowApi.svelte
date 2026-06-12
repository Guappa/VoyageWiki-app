<script lang="ts">
  import { useSvelteFlow } from "@xyflow/svelte";

  // Must render inside <SvelteFlow> so useSvelteFlow() finds the flow context.
  const { onready }: { onready: (api: ReturnType<typeof useSvelteFlow>) => void } = $props();

  const { screenToFlowPosition, fitView, setCenter } = useSvelteFlow();

  $effect(() => {
    onready({ screenToFlowPosition, fitView, setCenter });
  });
</script>
