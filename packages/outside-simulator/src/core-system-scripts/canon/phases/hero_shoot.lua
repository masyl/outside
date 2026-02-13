-- Hero shoot phase: fire in TargetDirection when ShootIntent is set.
local host = __canon_host

local heroes = host.list_armed_heroes()

for i = 1, #heroes do
  local eid = heroes[i]
  if host.get_shoot_intent(eid) ~= 1 then goto continue end

  local tx = host.get_target_direction_x(eid)
  local ty = host.get_target_direction_y(eid)
  local mag = host.get_target_direction_magnitude(eid)

  if mag < 0.1 then
    -- No aim direction: use current facing angle
    local angle = host.get_direction_angle(eid)
    host.fire_projectile(eid, angle)
  else
    local fire_angle = math.atan(ty, tx)
    host.fire_projectile(eid, fire_angle)
  end

  host.clear_shoot_intent(eid)

  ::continue::
end
