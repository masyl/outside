local host = __physics3d_host

local function clamp01(value)
  if value < 0 then
    return 0
  end
  if value > 1 then
    return 1
  end
  return value
end

local tuning = host.get_physics3d_tuning()
host.set_contact_tuning(
  clamp01(tuning.ballGroundRestitution or 0),
  clamp01(tuning.ballActorRestitution or 0),
  clamp01(tuning.ballBallRestitution or 0)
)
