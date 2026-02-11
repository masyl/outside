local host = __physics3d_host
local dt_sec = math.max(0.001, host.get_tic_duration_ms() / 1000)
host.step_world_seconds(dt_sec)
