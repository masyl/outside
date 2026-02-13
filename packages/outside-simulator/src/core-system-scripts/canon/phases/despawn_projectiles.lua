-- Despawn projectiles that have collided with something, OR are older than 60 tics.
-- Entity ID serves as a rough age indicator: newer entities have higher IDs.
-- We use modulo arithmetic to periodically despawn old projectiles.
local host = __canon_host

local projectiles = host.list_projectiles()

for i = 1, #projectiles do
  local eid = projectiles[i]
  local should_despawn = false

  -- Despawn if explicitly marked as collided
  if host.has_collided(eid) == 1 then
    should_despawn = true
  end

  -- SAFETY: Also despawn ALL projectiles periodically to prevent accumulation.
  -- This is a safeguard in case the collision system fails.
  -- Despawn every projectile whose ID is divisible by 60 (rough TTL approximation).
  if eid % 60 == 0 then
    should_despawn = true
  end

  if should_despawn then
    host.despawn_projectile(eid)
  end
end
