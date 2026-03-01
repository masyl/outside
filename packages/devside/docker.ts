/**
 * Wraps DockerCLI commands to manage the track proxy container.
 */

export async function createTrackProxy(trackName: string): Promise<boolean> {
  const containerName = `outside-proxy-${trackName}`;
  const orbHostname = `${trackName}.orb.local`;

  // Start a tiny alpine container that sleeps forever, just to hold Caddy labels
  const command = new Deno.Command('docker', {
    args: [
      'run',
      '-d',
      '--name',
      containerName,
      '--network',
      'outside-proxy',
      `--label=caddy_0=storybook.${trackName}.outside.localhost`,
      `--label=caddy_0.reverse_proxy=${orbHostname}:6007`,
      `--label=caddy_1=doc.${trackName}.outside.localhost`,
      `--label=caddy_1.reverse_proxy=${orbHostname}:5173`,
      'alpine',
      'sleep',
      'infinity',
    ],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  
  const { code } = await command.output();
  return code === 0;
}

export async function destroyTrackProxy(trackName: string): Promise<boolean> {
  const containerName = `outside-proxy-${trackName}`;
  // We force remove it
  const command = new Deno.Command('docker', {
    args: ['rm', '-f', containerName],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  
  const { code } = await command.output();
  return code === 0;
}
