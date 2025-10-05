export type QueueState<T extends string, U> = {
  queue: T[];
  results: Record<T, U>;
};

export const makeInitialQueueState = <T extends string, U>(initResults?: Record<T, U>): QueueState<T, U> => ({
  queue: [],
  results: initResults ?? ({} as Record<T, U>),
});
