# ADR-003: Infrastructure as Code with Terraform

## Status

Accepted

## Context

Bluebells & Thistles requires a reliable, repeatable way to provision and manage cloud infrastructure. Manual infrastructure management through web consoles leads to:

- **Configuration drift**: Production differs from staging, hard to track changes
- **No audit trail**: Can't see who changed what and when
- **Difficult disaster recovery**: Can't rebuild infrastructure from scratch quickly
- **No version control**: Infrastructure changes aren't tracked like code changes
- **Error-prone**: Manual clicks lead to mistakes and inconsistencies
- **Poor collaboration**: Hard for team members to understand infrastructure setup

The project needs Infrastructure as Code (IaC) to ensure:
- All infrastructure is version-controlled
- Changes are reviewed and tested
- Environments are reproducible
- Disaster recovery is straightforward
- Infrastructure evolves alongside application code

## Decision

Adopt **Terraform** as the primary Infrastructure as Code tool, with **Wrangler** (Cloudflare's CLI) as a complementary deployment tool.

### IaC Strategy

**Terraform manages**:
- Cloudflare Pages projects
- Cloudflare Workers (provisioning and bindings)
- D1 databases (creation)
- R2 buckets
- KV namespaces
- DNS records
- Custom domains and SSL certificates

**Wrangler manages**:
- Worker code deployments (actual JavaScript bundles)
- D1 migrations (SQL schema changes)
- Local development environment
- Secrets management (via `wrangler secret put`)

**Git manages**:
- All Terraform `.tf` files
- Worker source code
- Database migration files
- Configuration files (`wrangler.toml`)
- CI/CD workflows

### Repository Structure

```
terraform/
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars  # Gitignored
│   │   └── backend.tf
│   └── production/
│       ├── main.tf
│       ├── terraform.tfvars  # Gitignored
│       └── backend.tf
├── modules/
│   ├── cloudflare-app/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── database/
│       └── main.tf
└── README.md
```

### Terraform State Management

- **Backend**: Terraform Cloud (free tier for <5 users)
- **State locking**: Automatic via Terraform Cloud
- **State encryption**: Automatic via Terraform Cloud
- **Alternative**: S3 + DynamoDB for self-hosted state (if needed)

### Secret Management

**Development**:
- `.env` files (gitignored)
- Loaded via `dotenv` or similar

**CI/CD**:
- GitHub Secrets for sensitive values
- Passed to Terraform via environment variables
- Never committed to repository

**Production**:
- Terraform variables for infrastructure secrets
- Wrangler secrets for application secrets
- Both encrypted at rest by providers

## Rationale

### Why Terraform Over Alternatives?

**vs Pulumi**:
- Terraform has larger community and more examples
- HCL is declarative and easier to review in PRs
- More mature Cloudflare provider
- Industry standard (better for hiring/collaboration)

**vs CloudFormation**:
- Multi-cloud support (not locked to AWS)
- Better syntax (HCL vs JSON/YAML)
- Larger ecosystem of providers

**vs Ansible/Chef/Puppet**:
- These are configuration management, not IaC
- Terraform is declarative (describe desired state)
- Better for cloud resources vs server configuration

**vs Manual Cloudflare Dashboard**:
- Version controlled and auditable
- Repeatable across environments
- Testable (terraform plan before apply)
- Documented in code

### Why Terraform Cloud for State?

**vs Local State**:
- Team collaboration (shared state)
- Automatic locking (prevents concurrent changes)
- Encrypted storage
- Version history and rollback

**vs S3 + DynamoDB**:
- Simpler setup (no AWS account needed)
- Free tier sufficient for this project
- Better UI for viewing state
- Integrated with Terraform workflows

**vs Git (committing state)**:
- State contains secrets (shouldn't be in Git)
- Large files (bloats repository)
- Merge conflicts are painful
- Not recommended by HashiCorp

### Why Hybrid Approach (Terraform + Wrangler)?

**Terraform strengths**:
- Provisioning resources (databases, buckets, DNS)
- Managing resource relationships
- Multi-environment orchestration
- Declarative infrastructure

**Wrangler strengths**:
- Deploying Worker code (built JavaScript)
- Running migrations (SQL execution)
- Local development (miniflare)
- Secrets management (encrypted by Cloudflare)

**Together**:
- Terraform provisions infrastructure
- Wrangler deploys application code
- Clear separation of concerns
- Use best tool for each job

## Consequences

### Positive

**Version Control**:
- All infrastructure changes tracked in Git
- Pull request reviews for infrastructure changes
- Audit trail of who changed what and when
- Easy rollback to previous configurations

**Reproducibility**:
- Spin up new environments (staging, production) identically
- Disaster recovery: `terraform apply` rebuilds everything
- Onboarding: New developers see infrastructure in code

**Testing**:
- `terraform plan` shows changes before applying
- Can test infrastructure changes in staging first
- Catch errors before they reach production

**Documentation**:
- Infrastructure is self-documenting (code is truth)
- Comments explain why decisions were made
- No drift between docs and reality

**Automation**:
- CI/CD can apply infrastructure changes
- Consistent deployments across environments
- Reduces human error

### Negative

**Learning Curve**:
- Team must learn Terraform HCL syntax
- Understanding state management takes time
- Debugging Terraform errors can be tricky
- Mitigation: Comprehensive documentation, examples

**Initial Setup Time**:
- More upfront work than clicking in dashboard
- Setting up Terraform Cloud account
- Configuring CI/CD integration
- Mitigation: Investment pays off quickly

**State Management Complexity**:
- Must understand Terraform state
- State drift can occur if manual changes made
- Requires discipline to always use Terraform
- Mitigation: Clear guidelines, automated checks

**Two-Tool Workflow**:
- Terraform + Wrangler adds complexity
- Must understand when to use which tool
- Mitigation: Clear documentation, scripts that wrap both

### Risks and Mitigations

**Risk**: Terraform state corruption or loss
- **Mitigation**: Terraform Cloud has automatic backups, version history
- **Recovery**: Can import existing resources into new state

**Risk**: Secrets accidentally committed to Git
- **Mitigation**: `.gitignore` for `.tfvars`, pre-commit hooks, GitHub secret scanning
- **Response**: Rotate secrets immediately, use `git-filter-repo` to remove from history

**Risk**: Manual changes in Cloudflare dashboard cause drift
- **Mitigation**: Document "always use Terraform" policy, periodic `terraform plan` to detect drift
- **Response**: Import manual changes or revert them

**Risk**: Terraform Cloud outage prevents deployments
- **Mitigation**: Can switch to local state temporarily, Terraform Cloud has 99.9% SLA
- **Response**: Documented procedure for emergency local state usage

## Alternatives Considered

### 1. Native Cloudflare Config Files Only

**Approach**: Use only `wrangler.toml` and Cloudflare dashboard

**Pros**:
- Simpler (one tool)
- Cloudflare-native
- Faster initial setup

**Cons**:
- No multi-environment management
- DNS, domains not in code
- No dependency management
- Hard to reproduce environments

**Rejected**: Insufficient for production infrastructure management

### 2. Pulumi (TypeScript IaC)

**Approach**: Write IaC in TypeScript instead of HCL

**Pros**:
- Same language as application (TypeScript)
- Type safety for infrastructure
- More programmatic (loops, conditionals)

**Cons**:
- Smaller community than Terraform
- Less mature Cloudflare provider
- Harder to review (code vs declarative config)
- Steeper learning curve for non-programmers

**Rejected**: Terraform's maturity and community outweigh language consistency

### 3. Ansible for Infrastructure

**Approach**: Use Ansible playbooks for infrastructure

**Pros**:
- Familiar to many ops teams
- Can handle both infrastructure and configuration

**Cons**:
- Imperative (how) vs declarative (what)
- Not designed for cloud resources
- Weaker state management
- Less idempotent than Terraform

**Rejected**: Wrong tool for cloud infrastructure (better for server config)

### 4. Manual Management with Documentation

**Approach**: Click in dashboards, document steps in wiki

**Pros**:
- No IaC learning curve
- Fastest initial setup
- Direct feedback

**Cons**:
- Documentation drifts from reality
- Error-prone manual steps
- No version control
- Can't test changes
- Disaster recovery is slow

**Rejected**: Doesn't meet IaC requirement, not sustainable

## Implementation Guidelines

### Terraform Module Structure

```hcl
# terraform/modules/cloudflare-app/main.tf
resource "cloudflare_pages_project" "app" {
  account_id        = var.account_id
  name              = "${var.app_name}-${var.environment}"
  production_branch = var.git_branch
  
  source {
    type = "github"
    config {
      owner     = var.github_org
      repo_name = var.github_repo
    }
  }
}

resource "cloudflare_d1_database" "main" {
  account_id = var.account_id
  name       = "${var.app_name}-db-${var.environment}"
}

# Outputs for use in other modules
output "pages_url" {
  value = cloudflare_pages_project.app.subdomain
}

output "database_id" {
  value = cloudflare_d1_database.main.id
}
```

### Environment-Specific Configuration

```hcl
# terraform/environments/staging/main.tf
module "app" {
  source = "../../modules/cloudflare-app"
  
  environment  = "staging"
  app_name     = "bluebells"
  git_branch   = "main"
  github_org   = var.github_org
  github_repo  = "bluebellsandthistles"
  account_id   = var.cloudflare_account_id
}
```

### Workflow

```bash
# 1. Make infrastructure changes
vim terraform/environments/staging/main.tf

# 2. Plan changes (see what will happen)
cd terraform/environments/staging
terraform plan

# 3. Review plan output

# 4. Apply changes
terraform apply

# 5. Commit to Git
git add terraform/
git commit -m "infra: add R2 bucket for backups"
git push
```

### CI/CD Integration

```yaml
# .github/workflows/terraform.yml
- name: Terraform Plan
  run: terraform plan -out=tfplan
  
- name: Save plan for review
  uses: actions/upload-artifact@v4
  with:
    name: terraform-plan
    path: tfplan

# Only apply on approval
- name: Terraform Apply
  if: github.event_name == 'workflow_dispatch'
  run: terraform apply tfplan
```

## Success Criteria

This decision will be considered successful if:

1. **All infrastructure is in Git**: No manual resources in Cloudflare dashboard
2. **Reproducible environments**: Can spin up staging/production from scratch in <30 minutes
3. **Zero state issues**: No state corruption or drift in first 6 months
4. **Team adoption**: All infrastructure changes go through Terraform (no manual changes)
5. **Fast deployments**: Infrastructure changes deploy in <5 minutes
6. **Clear audit trail**: Can see all infrastructure changes in Git history

## Review and Evolution

- **Review date**: After 3 months of usage
- **Success metrics**: Track time to deploy, number of manual changes, state issues
- **Evolution**: May add more modules, consider Terragrunt for DRY, evaluate Pulumi again

## References

- [Terraform Documentation](https://www.terraform.io/docs)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Terraform Cloud](https://app.terraform.io/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- Internal: `ADR-002-tech-stack.md` - Technology stack decision
- Internal: `docs/developer/deployment.md` - Deployment workflow documentation

## Notes

- This decision was made on 2026-02-23
- Complements ADR-002 (tech stack) by defining how infrastructure is managed
- Terraform Cloud free tier is sufficient for solo/small team
- Can migrate to self-hosted state (S3) if team grows beyond 5 users
