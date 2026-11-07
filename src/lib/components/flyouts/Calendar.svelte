<script lang="ts">
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { region } from "#lib/state/region.svelte.ts";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Toggle from "../Toggle.svelte";

  const today = new Date();

  let weekInfo = $derived(
    new Intl.Locale(region.locale ?? navigator.language).getWeekInfo?.()
  );
  // The first day of the week, with Sunday as 0. The API counts it as 7.
  let weekStart = $derived(region.firstDay ?? (weekInfo?.firstDay ?? 1) % 7);
  let weekend = $derived((weekInfo?.weekend ?? [6, 7]).map((day) => day % 7));

  let year = $state(today.getFullYear());
  let month = $state(today.getMonth());
  let direction = $state<"next" | "previous">("next");

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const isWeekend = (day: number) => weekend.includes(day);

  /** ISO weeks belong to the year that holds their Thursday. */
  function weekNumber(week: Date[]) {
    const thursday = week.find((day) => day.getDay() === 4) ?? today;
    const firstOfYear = new Date(thursday.getFullYear(), 0, 1);
    const dayOfYear = Math.round(
      (thursday.getTime() - firstOfYear.getTime()) / 86_400_000
    );
    return Math.floor(dayOfYear / 7) + 1;
  }

  let weeks = $derived.by(() => {
    const first = new Date(year, month, 1);
    const before = (first.getDay() - weekStart + 7) % 7;

    return Array.from({ length: 6 }, (_, row) =>
      Array.from(
        { length: 7 },
        (_, column) => new Date(year, month, 1 - before + row * 7 + column)
      )
    );
  });

  let title = $derived(
    new Date(year, month, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    })
  );

  let weekdays = $derived(
    Array.from({ length: 7 }, (_, index) => {
      // 2023-01-01 was a Sunday.
      const day = new Date(2023, 0, 1 + weekStart + index);
      return {
        name: day.toLocaleDateString(undefined, { weekday: "narrow" }),
        weekend: isWeekend(day.getDay())
      };
    })
  );

  const moveMonth = (change: number) => {
    const next = new Date(year, month + change, 1);
    direction = change > 0 ? "next" : "previous";
    year = next.getFullYear();
    month = next.getMonth();
  };

  const showToday = () => {
    const change =
      today.getFullYear() * 12 + today.getMonth() - (year * 12 + month);
    if (change !== 0) moveMonth(change);
  };
</script>

<div class="flex items-center justify-between">
  <button
    class="step"
    aria-label="Previous month"
    onclick={() => {
      moveMonth(-1);
    }}
  >
    <ChevronLeft />
  </button>
  <button
    class="text-lg font-semibold hover:text-zb-accent"
    onclick={showToday}
  >
    {title}
  </button>
  <button
    class="step"
    aria-label="Next month"
    onclick={() => {
      moveMonth(1);
    }}
  >
    <ChevronRight />
  </button>
</div>

<div class="overflow-hidden">
  {#key `${year}-${month}`}
    <div
      class={[
        "month grid grid-cols-8 items-center justify-items-center text-sm tabular-nums",
        direction
      ]}
    >
      <span></span>
      {#each weekdays as weekday, index (index)}
        <span
          class={["py-1", weekday.weekend ? "text-zb-icon" : "text-zb-dim"]}
        >
          {weekday.name}
        </span>
      {/each}
      {#each weeks as week, row (row)}
        <span class="text-xs text-zb-memory/70">{weekNumber(week)}</span>
        {#each week as day (day.getTime())}
          {@const inMonth = day.getMonth() === month}
          <span
            class={[
              "day",
              isSameDay(day, today)
                ? "today"
                : [
                    !inMonth && "text-zb-faint",
                    inMonth && isWeekend(day.getDay()) && "weekend"
                  ]
            ]}
          >
            {day.getDate()}
          </span>
        {/each}
      {/each}
    </div>
  {/key}
</div>

<div
  class="flex items-center justify-between gap-3 rounded-well bg-zb-surface-1 px-3 py-2"
>
  <span>Show the date in the bar</span>
  <Toggle
    label="Show the date in the bar"
    checked={config.clock.fullDate !== false}
    onchange={(checked: boolean) =>
      updateSetting("clock.fullDate", checked ? "preferred" : false)}
  />
</div>

<style>
  .step {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    place-items: center;
    border-radius: 50%;
    font-size: 1.15rem;
    transition:
      background-color var(--transition-duration) var(--spring-out),
      color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .step:hover {
    background: var(--surface-2);
    color: hsl(var(--accent));
  }

  .step:active {
    scale: 0.88;
  }

  .month.next {
    animation: from-right var(--time-soft) var(--spring-soft);
  }

  .month.previous {
    animation: from-left var(--time-soft) var(--spring-soft);
  }

  @keyframes from-right {
    from {
      opacity: 0;
      translate: 1.3rem 0;
    }
  }

  @keyframes from-left {
    from {
      opacity: 0;
      translate: -1.3rem 0;
    }
  }

  .day {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    place-items: center;
    border-radius: 50%;
    transition:
      background-color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .day:hover {
    background: var(--surface-2);
    scale: 1.08;
  }

  .day.weekend {
    color: color-mix(in srgb, hsl(var(--icon)) 60%, hsl(var(--text)));
  }

  .day.today {
    background: color-mix(in srgb, hsl(var(--accent)) 32%, hsl(var(--bg)));
    color: hsl(var(--accent));
    font-weight: 700;
  }
</style>
