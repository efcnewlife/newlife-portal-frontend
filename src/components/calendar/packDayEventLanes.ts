export interface PackableEvent {
  id: string | number;
  start: string | Date;
  end: string | Date;
}

export interface EventLanePlacement {
  id: string;
  laneIndex: number;
  leftPercent: number;
  widthPercent: number;
}

export interface CollisionGroupOverflow {
  undrawnCount: number;
  start: Date;
  end: Date;
}

export interface PackDayEventLanesResult {
  placements: EventLanePlacement[];
  overflows: CollisionGroupOverflow[];
}

interface NormalizedEvent {
  id: string;
  startMs: number;
  endMs: number;
  start: Date;
  end: Date;
}

/** Fraction of the day column each later lane indents from the left (card stack). */
export const OVERLAY_INDENT_RATIO = 0.12;

/** Minimum width fraction so high lane indices stay clickable. */
export const OVERLAY_MIN_WIDTH_RATIO = 0.2;

const toDate = (value: string | Date): Date => (value instanceof Date ? value : new Date(value));

const normalizeEvent = (event: PackableEvent): NormalizedEvent => {
  const start = toDate(event.start);
  const end = toDate(event.end);
  return {
    id: String(event.id),
    startMs: start.getTime(),
    endMs: end.getTime(),
    start,
    end,
  };
};

const intervalsOverlap = (left: NormalizedEvent, right: NormalizedEvent): boolean =>
  left.startMs < right.endMs && right.startMs < left.endMs;

const findCollisionGroups = (events: NormalizedEvent[]): NormalizedEvent[][] => {
  const parent = events.map((_, index) => index);

  const find = (index: number): number => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };

  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parent[leftRoot] = rightRoot;
    }
  };

  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      if (intervalsOverlap(events[i], events[j])) {
        union(i, j);
      }
    }
  }

  const grouped = new Map<number, NormalizedEvent[]>();
  events.forEach((event, index) => {
    const root = find(index);
    const group = grouped.get(root);
    if (group) {
      group.push(event);
    } else {
      grouped.set(root, [event]);
    }
  });

  return [...grouped.values()].sort((left, right) => {
    const leftStart = Math.min(...left.map((event) => event.startMs));
    const rightStart = Math.min(...right.map((event) => event.startMs));
    return leftStart - rightStart;
  });
};

const assignColumns = (group: NormalizedEvent[]): Map<string, number> => {
  const sorted = [...group].sort((left, right) => {
    const byStart = left.startMs - right.startMs;
    if (byStart !== 0) {
      return byStart;
    }
    return right.endMs - left.endMs;
  });

  const columnEnds: number[] = [];
  const columnById = new Map<string, number>();

  sorted.forEach((event) => {
    let column = columnEnds.findIndex((lastEndMs) => lastEndMs <= event.startMs);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.endMs);
    } else {
      columnEnds[column] = Math.max(columnEnds[column], event.endMs);
    }
    columnById.set(event.id, column);
  });

  return columnById;
};

const overlayPlacement = (laneIndex: number): { leftPercent: number; widthPercent: number } => {
  const leftRatio = Math.min(laneIndex * OVERLAY_INDENT_RATIO, 1 - OVERLAY_MIN_WIDTH_RATIO);
  const leftPercent = leftRatio * 100;
  return {
    leftPercent,
    widthPercent: 100 - leftPercent,
  };
};

const packGroup = (
  group: NormalizedEvent[],
  maxLaneCount: number,
): { placements: EventLanePlacement[]; overflow: CollisionGroupOverflow | null } => {
  const columnById = assignColumns(group);
  const placements: EventLanePlacement[] = [];
  let undrawnCount = 0;

  const sorted = [...group].sort((left, right) => {
    const byStart = left.startMs - right.startMs;
    if (byStart !== 0) {
      return byStart;
    }
    return right.endMs - left.endMs;
  });

  sorted.forEach((event) => {
    const laneIndex = columnById.get(event.id) ?? 0;
    if (laneIndex >= maxLaneCount) {
      undrawnCount += 1;
      return;
    }
    const { leftPercent, widthPercent } = overlayPlacement(laneIndex);
    placements.push({
      id: event.id,
      laneIndex,
      leftPercent,
      widthPercent,
    });
  });

  if (undrawnCount === 0) {
    return { placements, overflow: null };
  }

  return {
    placements,
    overflow: {
      undrawnCount,
      start: new Date(Math.min(...group.map((event) => event.startMs))),
      end: new Date(Math.max(...group.map((event) => event.endMs))),
    },
  };
};

export const packDayEventLanes = (events: PackableEvent[], maxLaneCount: number): PackDayEventLanesResult => {
  if (events.length === 0) {
    return { placements: [], overflows: [] };
  }

  const normalized = events.map(normalizeEvent);
  const placements: EventLanePlacement[] = [];
  const overflows: CollisionGroupOverflow[] = [];

  findCollisionGroups(normalized).forEach((group) => {
    const packed = packGroup(group, maxLaneCount);
    placements.push(...packed.placements);
    if (packed.overflow) {
      overflows.push(packed.overflow);
    }
  });

  return { placements, overflows };
};
