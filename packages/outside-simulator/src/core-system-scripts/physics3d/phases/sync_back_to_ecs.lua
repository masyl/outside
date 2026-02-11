local host = __physics3d_host
local entity_ids = host.list_body_entity_ids()

for i = 1, #entity_ids do
  local eid = entity_ids[i]
  if host.has_position_component(eid) == 1 and host.has_obstacle_size_component(eid) == 1 then
    local position_x = host.get_body_position_x(eid)
    local position_z = host.get_body_position_z(eid)
    local position_y = host.get_body_position_y(eid)

    host.set_position_xy(eid, position_x, position_z)
    host.set_position_z(eid, position_y)
    host.set_velocity_z(eid, host.get_body_velocity_y(eid))

    local radius = host.get_obstacle_radius(eid)
    local grounded = (radius > 0 and position_y <= radius + 0.03) and 1 or 0
    host.set_grounded(eid, grounded)

    local linear_speed = host.get_body_velocity_length(eid)
    if linear_speed ~= linear_speed then
      linear_speed = 0
    end
    host.set_actual_speed(eid, linear_speed)
  end
end
