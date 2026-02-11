local host = __physics3d_host
host.clear_collision_pair_seen()

local contact_indices = host.list_contact_indices()
for i = 1, #contact_indices do
  local contact_index = contact_indices[i]
  local eid_a = host.get_contact_entity_a(contact_index)
  local eid_b = host.get_contact_entity_b(contact_index)

  if host.can_entities_collide(eid_a, eid_b) == 1 then
    if host.mark_collision_pair_if_new(eid_a, eid_b) == 1 then
      host.emit_collision_event(eid_a, eid_b)
      host.set_collided_ticks(eid_a, 2)
      host.set_collided_ticks(eid_b, 2)
      host.apply_collision_responses_for_contact(contact_index, eid_a, eid_b)
    end
  end
end
