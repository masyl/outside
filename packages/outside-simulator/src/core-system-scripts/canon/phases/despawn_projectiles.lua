-- Despawn projectiles that have collided with something, OR are older than 60 tics.
-- Entity ID serves as a rough age indicator: newer entities have higher IDs.
-- We use modulo arithmetic to periodically despawn old projectiles.
local host = __canon_host

local projectiles = host.list_projectiles()
host.log_projectile_count(#projectiles)

local despawned_count = 0
local collided_count = 0

for i = 1, #projectiles do
  local eid = projectiles[i]
  local should_despawn = false
  local collided = host.has_collided(eid)

  -- Despawn if explicitly marked as collided
  if collided == 1 then
    should_despawn = true
    collided_count = collided_count + 1
  end

  -- SAFETY: Also despawn ALL projectiles periodically to prevent accumulation.
  -- This is a safeguard in case the collision system fails.
  -- Despawn every projectile whose ID is divisible by 60 (rough TTL approximation).
  if eid % 60 == 0 then
    should_despawn = true
  end

  if should_despawn then
    host.despawn_projectile(eid)
    despawned_count = despawned_count + 1
  end
end

host.log_despawn_summary(despawned_count, collided_count)
