export const GITHUB_TOOLS = [
    {
        name: "github_list_runs",
        description: "List the recent GitHub Actions workflow runs for the repository. Optionally filter by branch. Use this to monitor CI pipeline status.",
        inputSchema: {
            type: "object",
            properties: {
                branch: {
                    type: "string",
                    description: "Optional branch name to filter runs (e.g. 'trunk' or 'track/agent-skills-vendor-sync')",
                },
                limit: {
                    type: "number",
                    description: "Max number of runs to return (default 10)"
                }
            }
        }
    }
];

export async function handleGithubTool(name: string, args: Record<string, unknown> | undefined) {
    if (name === "github_list_runs") {
        const branch = args?.branch as string | undefined;
        const limit = (args?.limit as number) || 10;

        const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (!token) {
            return {
                content: [{ type: "text", text: "GITHUB_PERSONAL_ACCESS_TOKEN environment variable not set. Please set it in .env.local for pipeline visibility." }],
                isError: true
            };
        }

        // Hardcoded to the current repository for this context
        let url = `https://api.github.com/repos/masyl/outside/actions/runs?per_page=${limit}`;
        if (branch) {
            url += `&branch=${encodeURIComponent(branch)}`;
        }

        try {
            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "toolchain-mcp",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            if (!res.ok) {
                const text = await res.text();
                return {
                    content: [{ type: "text", text: `GitHub API error: ${res.status} ${res.statusText}\n${text}` }],
                    isError: true
                };
            }

            const data = await res.json() as any;
            const runs = data.workflow_runs.map((r: any) => ({
                id: r.id,
                name: r.name,
                head_branch: r.head_branch,
                status: r.status,
                conclusion: r.conclusion,
                html_url: r.html_url,
                created_at: r.created_at
            }));

            return {
                content: [{ type: "text", text: JSON.stringify(runs, null, 2) }]
            };
        } catch (err: any) {
            return {
                content: [{ type: "text", text: `Error calling GitHub API: ${err.message}` }],
                isError: true
            };
        }
    }

    throw new Error(`Unhandled GitHub tool: ${name}`);
}
