export type ActivityStep = { stage: string; message: string };
export function appendActivity(steps: ActivityStep[], event: ActivityStep): ActivityStep[] {
  const last = steps.at(-1);
  if (!event.stage || !event.message || last?.stage === event.stage && last.message === event.message) return steps;
  return [{ stage: event.stage, message: event.message }];
}
