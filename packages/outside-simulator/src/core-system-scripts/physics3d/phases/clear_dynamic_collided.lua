local host = __physics3d_host
local collided = host.get_collided_entities()

for i = 1, #collided do
  local eid = collided[i]
  local ticks = host.get_collided_ticks(eid)
  if ticks > 0 then
    host.set_collided_ticks(eid, ticks - 1)
  end
end
