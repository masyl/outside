local host = __physics3d_host
local candidates = host.list_position_entity_candidates()
local seen = {}

for i = 1, #candidates do
  local eid = candidates[i]
  if host.should_have_body(eid) == 1 then
    seen[eid] = true
    if host.has_body(eid) == 0 then
      host.add_body_for_entity(eid)
    end
  end
end

local existing = host.list_body_entity_ids()
for i = 1, #existing do
  local eid = existing[i]
  if not seen[eid] then
    host.remove_body_for_entity(eid)
  end
end
