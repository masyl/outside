/**
 * Entity list access via bitecs serialization (SoA, Observer, Snapshot).
 * Re-exports from bitecs/serialization so consumers can serialize/deserialize
 * entity data without defining custom interfaces.
 *
 * @packageDocumentation
 */

export {
  createSoASerializer,
  createSoADeserializer,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  createObserverSerializer,
  createObserverDeserializer,
  u8,
  i8,
  u16,
  i16,
  u32,
  i32,
  f32,
  f64,
  str,
  array,
  ref,
  $i8,
  $u16,
  $i16,
  $u32,
  $i32,
  $f32,
  $f64,
  $u8,
  $str,
  $ref,
} from 'bitecs/serialization';
export type {
  ObserverSerializerOptions,
  ObserverDeserializerOptions,
  AoSSerializerOptions,
  AoSDeserializerOptions,
  PrimitiveBrand,
} from 'bitecs/serialization';
