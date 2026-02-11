local host = __physics3d_host
local entities = host.list_desired_velocity_entities()

for i = 1, #entities do
  local eid = entities[i]
  local angle = host.get_direction_angle(eid)
  local speed = math.max(0, host.get_speed_tiles_per_sec(eid))
  local desired_x = math.cos(angle) * speed
  local desired_z = math.sin(angle) * speed
  local current_x = host.get_body_velocity_x(eid)
  local current_z = host.get_body_velocity_z(eid)
  local impulse_x = (desired_x - current_x) * 0.08
  local impulse_z = (desired_z - current_z) * 0.08
  host.apply_body_impulse_xz(eid, impulse_x, impulse_z)
end
