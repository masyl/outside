-- Physics3D core system script phase order.
-- One phase id per line, parsed and validated by the TypeScript host runtime.
return table.concat({
  "ensure_state",
  "apply_contact_tuning",
  "clear_dynamic_collided",
  "rebuild_bodies",
  "apply_desired_velocity",
  "step_world",
  "emit_dynamic_collision_events",
  "sync_back_to_ecs",
}, "\n")
