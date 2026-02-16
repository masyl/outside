---
name: "ADR-004: Select GitHub and Render for CI/CD and Deployment"
status: Accepted
---

# ADR-004: Select GitHub and Render for CI/CD and Deployment

**Context:**

The Outside project requires a robust CI/CD and deployment infrastructure to support the trunk-based development workflow with frequent, automated deployments. Key requirements include:

- **CI/CD Platform**: Automated test execution, type checking, linting, security scanning, and PR validation
- **Hosting for Backend Services**: Long-running Node.js processes (game simulations, key/value stores) that cannot be served by traditional serverless functions
- **Source Control & Automation**: Integration with version control, automated PR creation, automated merge decisions, and deployment triggers
- **Cost Management**: Sustainable hosting costs with clear pricing models and available free/trial tiers for development

Previously, these needs were unresolved, with several competing options considered:

- **CI/CD**: GitHub Actions vs CircleCI vs self-hosted runners
- **Backend Hosting**: Vercel (serverless) vs Render (persistent services) vs Fly.io vs self-hosting on Oracle Cloud
- **Test Execution**: Relying on CI/CD minutes vs running tests locally with CI/CD as safety net

**Decision:**

We adopt the following two-part solution:

1. **GitHub for Source Control & CI/CD**
   - Use GitHub Actions for all CI/CD workflows (test execution, type checks, linting, security scanning)
   - Leverage GitHub's tight integration with repositories for automated PR creation, merge decisions, and deployment triggers
   - Subscribe to GitHub Team plan for private repositories (enables 2,000 CI/CD minutes/month for private repos)

2. **Render for Backend Service Hosting**
   - Use Render as the primary deployment target for long-running Node.js processes (game simulations, key/value stores, API servers)
   - Leverage Render's persistent web services (no cold starts, support for 100+ minute request timeouts)
   - Use Render's background workers for asynchronous job processing if needed
   - Utilize free tier for development/testing; upgrade to paid tier for production as needed

3. **Test Execution Strategy**
   - **Local-first testing**: Run full test suite locally during development before pushing
   - **CI/CD as safety net**: Use GitHub Actions to run tests on every PR and trunk push
   - **Budget management**: With 500 minutes/month on Render and 2,000 minutes/month on GitHub, prioritize GitHub Actions for test execution
   - **Optimization**: Cache test dependencies and run only critical tests in CI where needed to conserve minutes

**Implementation:**

### Phase 2 (CI/CD Pipeline Enhancement)
- Set up GitHub Actions workflows for:
  - Test execution (runs locally first, then CI validates)
  - TypeScript type checking
  - Linting (ESLint, Prettier)
  - Security scanning (Dependabot, optional SAST)
  - Sonarqube or similar for code quality (optional)
- Configure workflows to trigger on trunk branch pushes and PRs to trunk
- Implement PR checks to block merge if CI fails

### Phase 6 (Automated Production Deployment)
- Create GitHub Actions workflow to build and deploy to Render on trunk merge
- Configure Render environment variables and secrets via GitHub Secrets
- Implement health checks on Render-hosted services before marking deployment successful
- Set up automatic rollback to previous Render deployment if health checks fail
- Configure deployment notifications to Slack/Discord/email

### Test Strategy
- Developers run full test suite locally before pushing (no CI/CD minutes wasted on basic failures)
- GitHub Actions runs as automated safety check, catching environment-specific issues
- Use pytest caching, npm caching, and other optimization to minimize workflow runtime
- Document the test execution split in `docs/development/testing-strategy.md`

**Consequences:**

**Positive:**
- **Seamless Integration**: GitHub Actions integrates natively with repositories, simplifying automated PR creation and merge logic
- **Scalable CI/CD**: 2,000 minutes/month on GitHub provides ample room for test execution across team
- **Long-Running Processes**: Render's persistent services are purpose-built for game simulations and stateful backends, unlike serverless alternatives
- **No Cold Starts**: Render services remain warm, critical for game simulation APIs that need immediate responsiveness
- **Cost Predictability**: Clear, tiered pricing on both GitHub (per repo) and Render (per service)
- **Vendor Independence**: Both GitHub and Render are industry-standard platforms with strong communities and documentation
- **Sustainable for Team Growth**: As the team grows, both platforms scale smoothly without architectural changes

**Negative:**
- **Cost at Scale**: GitHub Team plan ($4/user/month) and Render paid tiers add up as team grows
- **Vendor Lock-in**: Migrating CI/CD or hosting would require rewriting workflows and redeploying services
- **GitHub Actions Learning Curve**: YAML workflow syntax is different from other CI/CD platforms; new team members need onboarding
- **Render's Free Tier Limits**: Free tier has 7.5 days/month uptime; production requires paid tier
- **No Built-in Canary Deployments**: Render doesn't offer staged rollouts; requires custom implementation if needed later

**Alternatives Considered:**

1. **Vercel + GitHub Actions**
   - Why rejected: Vercel is serverless-focused with strict function timeouts (60s free, 900s paid). Game simulations and persistent servers need longer execution windows. Vercel's function model incompatible with long-running processes.

2. **CircleCI + Fly.io**
   - Why rejected: CircleCI has lower free tier (750 minutes/month, insufficient for team). Fly.io excellent but moved to usage-based billing in 2024, less predictable costs. GitHub Actions integration is simpler.

3. **GitLab CI + Railway**
   - Why rejected: Switching from GitHub limits community integrations. Railway also moved to usage-based billing. GitHub's native CI/CD and large community make it preferable.

4. **Self-Hosted Runners on Oracle Cloud Always Free VPS**
   - Why rejected: Requires significant ops overhead to manage runners, firewall rules, and infrastructure. Not scalable as team grows. Chosen approach (GitHub + Render) is lower maintenance.

5. **GitHub Actions + Heroku**
   - Why rejected: Heroku removed free tier in Nov 2022. All deployments now require paid plan. Render offers better free tier for development.

6. **AWS Lambda + CodePipeline**
   - Why rejected: Overkill for project scale. Complex IAM setup. Serverless model doesn't match game simulation requirements.

**Related Decisions:**

- ADR-001: Adopt Architectural Decision Records
- ADR-002: Adopt Smithery for Unified MCP and Skill Management
- ADR-003: Select BitECS as Reference ECS Implementation
- [Trunk-Based Development Plan](../../packages/outside-design/docs/deliveries/2026-02-14-1400-tbd-cicd-automation/plan.md)

**Migration Path:**

If circumstances change in the future:

- **To Fly.io**: Render and Fly.io are similar enough that switching primarily requires updating GitHub Actions deployment step (no code changes)
- **To Custom Docker Hosting**: Render services are Docker-based; migrating to AWS ECS or Kubernetes would be straightforward
- **To Different CI/CD**: GitHub Actions can be replaced with CircleCI, GitLab CI, or self-hosted runners by updating workflow files only
