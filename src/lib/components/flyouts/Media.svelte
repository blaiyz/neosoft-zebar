<script lang="ts">
  import { chooseSession, shownSession } from "#lib/state/media.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { untrack } from "svelte";
  import MediaCard from "./MediaCard.svelte";

  let media = $derived(providers.media);
  let shownId = $derived(shownSession(media)?.sessionId);

  // Players keep the place they first had, so that one starting to play doesn't
  // jump to the top. The marker beside them shows which the bar has.
  let order = $state<string[]>([]);
  $effect(() => {
    const ids = (media?.allSessions ?? []).map(({ sessionId }) => sessionId);
    const kept = untrack(() => order).filter((id) => ids.includes(id));
    order = [...kept, ...ids.filter((id) => !kept.includes(id))];
  });

  let sessions = $derived(
    (media?.allSessions ?? []).toSorted(
      (a, b) => order.indexOf(a.sessionId) - order.indexOf(b.sessionId)
    )
  );

  let list = $state<HTMLElement>();
  let marker = $state<{ top: number; height: number } | null>(null);

  /** Goes by place in the list, so that it runs again when the order changes. */
  const placeMarker = () => {
    const index = sessions.findIndex(({ sessionId }) => sessionId === shownId);
    const card = list?.querySelectorAll<HTMLElement>("[data-session]")[index];
    marker = card ? { top: card.offsetTop, height: card.offsetHeight } : null;
  };

  $effect(() => {
    if (!list) return;
    placeMarker();

    const observer = new ResizeObserver(placeMarker);
    observer.observe(list);
    return () => {
      observer.disconnect();
    };
  });
</script>

{#if media && sessions.length > 0}
  <div class="relative flex flex-col gap-3" bind:this={list}>
    {#if marker && sessions.length > 1}
      <span
        class="marker"
        style:top="{marker.top}px"
        style:height="{marker.height}px"
        aria-hidden="true"
      ></span>
    {/if}
    {#each sessions as session (session.sessionId)}
      <div data-session={session.sessionId}>
        <MediaCard
          {session}
          {media}
          shown={session.sessionId === shownId}
          onshow={() => {
            chooseSession(media, session.sessionId);
          }}
        />
      </div>
    {/each}
  </div>
{:else}
  <p class="p-3 text-center text-zb-dim">Nothing is playing.</p>
{/if}

<style>
  .marker {
    position: absolute;
    left: -0.8rem;
    width: 0.25rem;
    border-radius: 999px;
    background: hsl(var(--accent));
    transition:
      top var(--time-soft) var(--spring-soft),
      height var(--time-soft) var(--spring-soft);
  }
</style>
