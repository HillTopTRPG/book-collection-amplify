export type QueueState<T extends string, U> = {
  queue: T[];
  results: Record<T, U>;
};

export const makeInitialQueueState = <T extends string, U>(): QueueState<T, U> => ({
  queue: [],
  results: {} as Record<T, U>,
});
