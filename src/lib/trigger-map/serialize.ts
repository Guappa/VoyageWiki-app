export function serializeWorld(world: unknown): string {
  return JSON.stringify(world, null, 2);
}
