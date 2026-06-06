<script lang="ts">
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as Button from '$lib/components/ui/button';
  import * as Popover from '$lib/components/ui/popover';
  import { cn } from '$lib/utils';
  import { CalendarDate, getLocalTimeZone, parseDate } from '@internationalized/date';

  let {
    id,
    value = '',
    placeholder = 'Selecciona una fecha',
    onChange,
  }: {
    id: string;
    value?: string;
    placeholder?: string;
    onChange: (value: string) => void;
  } = $props();

  let open = $state(false);
  let calendarValue = $state<CalendarDate | undefined>(undefined);
  let lastCommittedValue = $state('');

  $effect(() => {
    const nextValue = toCalendarDate(value);
    if (toDateOnlyString(calendarValue) !== toDateOnlyString(nextValue)) {
      calendarValue = nextValue;
    }
    lastCommittedValue = value;
  });

  function toDateOnlyString(dateValue?: CalendarDate) {
    if (!dateValue) return '';

    return `${dateValue.year.toString().padStart(4, '0')}-${dateValue.month
      .toString()
      .padStart(2, '0')}-${dateValue.day.toString().padStart(2, '0')}`;
  }

  function toCalendarDate(rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed) return undefined;

    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return parseDate(isoMatch[1]);
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return new CalendarDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  function formatDisplay(rawValue: string) {
    const dateOnly = rawValue.trim();
    if (!dateOnly) return placeholder;

    const parsed = new Date(`${dateOnly}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return rawValue;
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeZone: getLocalTimeZone(),
    }).format(parsed);
  }

  function handleCalendarValueChange(nextValue: CalendarDate | undefined) {
    const nextDateValue = toDateOnlyString(nextValue);

    calendarValue = nextValue;

    if (nextDateValue && nextDateValue !== lastCommittedValue) {
      onChange(nextDateValue);
      open = false;
      lastCommittedValue = nextDateValue;
    }
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger class="w-full">
    <Button.Root
      {id}
      variant="outline"
      class={cn('w-full justify-between text-left font-normal', !value && 'text-muted-foreground')}
    >
      <span class="truncate">{formatDisplay(value)}</span>
      <CalendarIcon class="size-4 opacity-70" />
    </Button.Root>
  </Popover.Trigger>
  <Popover.Content align="start" class="w-auto p-0">
    <Calendar
      bind:value={calendarValue}
      onValueChange={(nextValue) =>
        handleCalendarValueChange(nextValue as CalendarDate | undefined)}
      locale="es-PE"
      captionLayout="dropdown"
      yearFormat="numeric"
      class="rounded-md border"
    />
  </Popover.Content>
</Popover.Root>
