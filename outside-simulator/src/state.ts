/**
 * Query entities by component set (bitecs 0.4 API).
 * Use this to get the list of entity IDs matching given components, then read
 * from component SoA arrays (e.g. Position.x[eid]) or use serialization:
 *
 * - **SoA**: createSoASerializer(components) / createSoADeserializer(components);
 *   pass query(world, components) to serialize(entityIds) for raw buffer.
 * - **Observer**: createObserverSerializer(world, Observed, components) to track
 *   add/remove of entities/components; call serializer() for delta buffer.
 * - **Snapshot**: createSnapshotSerializer(world, components); call serializer()
 *   for full state buffer.
 *
 * @packageDocumentation
 */

export { query } from 'bitecs';
