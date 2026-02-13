-- Bot shoot phase: each armed bot with a hostile-faction enemy in range fires a projectile.
local host = __canon_host

local shooters = host.list_armed_bots()

for i = 1, #shooters do
  local eid = shooters[i]
  local mask = host.get_hostile_mask(eid)
  if mask == 0 then goto continue end

  local range = host.get_canon_range(eid)
  local sx = host.get_position_x(eid)
  local sy = host.get_position_y(eid)

  local target = host.find_nearest_hostile(eid, mask, sx, sy, range)
  if target == 0 then goto continue end

  -- Snap direction to target, add seeded angular error
  local tx = host.get_position_x(target)
  local ty = host.get_position_y(target)
  local dx = tx - sx
  local dy = ty - sy
  local base_angle = math.atan(dy, dx)
  local error_rad = host.random_angular_error(eid)
  local fire_angle = base_angle + error_rad

  host.fire_projectile(eid, fire_angle)

  ::continue::
end
