# Reference Architecture: FHEVM Example Hub System

## System Overview

This document describes the complete architecture for building and managing FHEVM example repositories. It covers the system design, file organization, automation workflows, and integration points.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FHEVM Example Hub                          │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  Automation │  │  Examples   │  │   Docs      │
   │   Scripts   │  │ Repository  │  │ Generation  │
   └─────────────┘  └─────────────┘  └─────────────┘
        │                   │                   │
        ├──────────────────┬┴──────────────────┤
        │                  │                   │
        ▼                  ▼                   ▼
    ┌─────────────────────────────────────────────────┐
    │        Base Hardhat Template                    │
    │  (Shared configuration & setup)                 │
    └─────────────────────────────────────────────────┘
        │
        ├──────────────┬──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Example │  │ Example │  │ Example │  │ Example │
    │   Repo  │  │   Repo  │  │   Repo  │  │   Repo  │
    │  Basic  │  │ Auction │  │ Token   │  │ Advanced│
    └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

---

## Directory Structure

### Root Level

```
fhevm-examples-hub/
├── package.json                    # Workspace root config
├── tsconfig.json                   # TypeScript config
├── README.md                       # Main documentation
├── CONTRIBUTING.md                 # Contribution guidelines
├── LICENSE                         # BSD-3-Clause-Clear
├── DEPLOYMENT_GUIDE.md             # How to deploy examples
├── MAINTENANCE_GUIDE.md            # How to update examples
│
├── scripts/                        # Automation tools
│   ├── create-fhevm-example.ts     # Generate single example
│   ├── create-fhevm-category.ts    # Generate category project
│   ├── generate-docs.ts            # Generate markdown docs
│   ├── update-dependencies.ts      # Bulk update script
│   ├── validate-examples.ts        # Validation script
│   ├── README.md                   # Scripts documentation
│   └── utils/
│       ├── file-utils.ts
│       ├── config-reader.ts
│       └── template-processor.ts
│
├── base-template/                  # Hardhat template
│   ├── contracts/
│   │   └── Example.sol             # Template contract
│   ├── test/
│   │   └── Example.ts              # Template test
│   ├── tasks/
│   │   ├── deploy.ts
│   │   └── interact.ts
│   ├── deploy/
│   │   └── deploy.ts               # Hardhat-deploy script
│   ├── hardhat.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .eslintrc.json
│   ├── .solhintrc.json
│   └── .prettierrc
│
├── contracts/                      # Source contracts
│   ├── basic/
│   │   ├── FHECounter.sol
│   │   ├── FHEAdd.sol
│   │   ├── FHEIfThenElse.sol
│   │   ├── encrypt/
│   │   │   ├── EncryptSingleValue.sol
│   │   │   └── EncryptMultipleValues.sol
│   │   └── decrypt/
│   │       ├── UserDecryptSingleValue.sol
│   │       ├── UserDecryptMultipleValues.sol
│   │       ├── PublicDecryptSingleValue.sol
│   │       └── PublicDecryptMultipleValues.sol
│   ├── auctions/
│   │   ├── BlindAuction.sol
│   │   └── ConfidentialDutchAuction.sol
│   ├── tokens/
│   │   ├── ERC7984Example.sol
│   │   ├── ERC7984Freezable.sol
│   │   └── ERC7984Rwa.sol
│   ├── finance/
│   │   ├── VestingWalletConfidential.sol
│   │   └── TokenSwap.sol
│   ├── advanced/
│   │   ├── ComplexArithmetic.sol
│   │   ├── MultiPartyComputation.sol
│   │   └── PrivacyPreservingVoting.sol
│   └── README.md                   # Contracts guide
│
├── test/                           # Source tests
│   ├── basic/
│   │   ├── FHECounter.ts
│   │   ├── FHEAdd.ts
│   │   ├── FHEIfThenElse.ts
│   │   ├── encrypt/
│   │   └── decrypt/
│   ├── auctions/
│   │   ├── BlindAuction.ts
│   │   └── ConfidentialDutchAuction.ts
│   ├── tokens/
│   ├── finance/
│   ├── advanced/
│   ├── fixtures/
│   │   ├── contracts.ts            # Common fixtures
│   │   ├── signers.ts              # Signer setup
│   │   └── encrypted-inputs.ts     # Encryption helpers
│   └── README.md                   # Testing guide
│
├── docs/                           # Generated documentation
│   ├── SUMMARY.md                  # GitBook index
│   ├── README.md                   # Docs overview
│   ├── GETTING_STARTED.md          # Quick start
│   ├── CONCEPTS.md                 # FHE concepts
│   ├── basic/
│   │   ├── 00-fhe-counter.md
│   │   ├── 01-fhe-add.md
│   │   ├── 02-fhe-if-then-else.md
│   │   ├── encrypt/
│   │   │   ├── 01-single-value.md
│   │   │   └── 02-multiple-values.md
│   │   └── decrypt/
│   │       ├── 01-user-single.md
│   │       ├── 02-user-multiple.md
│   │       ├── 03-public-single.md
│   │       └── 04-public-multiple.md
│   ├── auctions/
│   │   ├── 01-blind-auction.md
│   │   └── 02-dutch-auction.md
│   ├── tokens/
│   │   └── 01-erc7984.md
│   ├── finance/
│   │   └── 01-vesting-wallet.md
│   └── advanced/
│       └── 01-complex-patterns.md
│
├── output/                         # Generated example repos
│   ├── fhevm-example-fhe-counter/
│   ├── fhevm-example-blind-auction/
│   ├── fhevm-category-basic/
│   └── [other generated repos...]
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml                # Run tests
│   │   ├── deploy.yml              # Deploy to Sepolia
│   │   ├── docs.yml                # Generate docs
│   │   └── validate.yml            # Validate examples
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── .gitignore
├── .eslintrc.json
├── .prettierrc
└── CHANGELOG.md
```

---

## Data Flow Architecture

### Example Creation Flow

```
┌──────────────────────────────────────────────────────┐
│  npm run create-example fhe-counter ./output         │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  Read EXAMPLES_MAP config         │
        │  Map example name to files        │
        └───────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  ┌──────────┐  ┌──────────┐  ┌──────��───┐
  │Copy base │  │Copy      │  │Copy      │
  │template  │  │contract  │  │test      │
  └──────────┘  └──────────┘  └──────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  Update package.json              │
        │  - Name: fhevm-example-fhe-counter│
        │  - Description from config        │
        └───────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  Generate README.md               │
        │  - From contract JSDoc            │
        │  - From test documentation        │
        │  - Add usage examples             │
        └───────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  Update deployment script         │
        │  - Replace contract names         │
        │  - Adjust deployment logic        │
        └───────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────────┐
    │  Output: Ready-to-use standalone repo      │
    │  ./output/fhevm-example-fhe-counter/       │
    │  ├── contracts/FHECounter.sol              │
    │  ├── test/FHECounter.ts                    │
    │  ├── hardhat.config.ts                     │
    │  ├── package.json                          │
    │  └── README.md                             │
    └─────────────────────────────────────────────┘
```

### Documentation Generation Flow

```
┌──────────────────────────────────────────┐
│  npm run generate-docs [example-name]    │
└──────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │Read EXAMPLES_CONFIG       │
        │Find contract and test     │
        └───────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────────┐      ┌──────────────┐
  │Read Contract │      │Read Test     │
  │Extract JSDoc │      │Extract JSDoc │
  └──────────────┘      └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │Create Markdown with Tabs  │
        │Contract || Test side-by-  │
        │          side             │
        └───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │Add GitBook Navigation     │
        │Update SUMMARY.md          │
        └───────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────┐
    │Output: Markdown documentation   │
    │docs/basic/fhe-counter.md        │
    └─────────────────────────────────┘
```

---

## Component Architecture

### 1. Automation Scripts

```typescript
// scripts/create-fhevm-example.ts

interface ExampleConfig {
  name: string;
  contract: string;
  test: string;
  title: string;
  description: string;
}

interface ExampleGenerator {
  copyTemplate(src: string, dest: string): void;
  copyContract(src: string, dest: string): void;
  copyTest(src: string, dest: string): void;
  updatePackageJson(dest: string, config: ExampleConfig): void;
  generateReadme(dest: string, config: ExampleConfig): void;
  updateDeploymentScript(dest: string, config: ExampleConfig): void;
}

// Usage
const generator = new ExampleGenerator(baseTemplatePath);
await generator.create("fhe-counter", outputPath);
```

**Responsibilities:**
- Template validation
- File copying
- Configuration updates
- Documentation generation
- Error handling

### 2. Base Template

```
base-template/
├── Structure that every example inherits
├── Default configurations
├── Example files (placeholder)
└── Ready-to-customize setup
```

**Key Features:**
- Latest dependencies (@fhevm/solidity, hardhat, ethers)
- Pre-configured hardhat.config.ts
- TypeScript setup with strict mode
- Pre-made test fixtures
- npm scripts for common tasks
- GitHub Actions CI/CD templates

### 3. Source Examples Repository

```
contracts/ & test/
├── Organized by category
├── Single responsibility per contract
├── Comprehensive test coverage
└── JSDoc documentation
```

**Categories:**
- **Basic:** Fundamental FHE operations
- **Auctions:** Advanced auction patterns
- **Tokens:** ERC7984 and variations
- **Finance:** DeFi primitives
- **Advanced:** Complex multi-operation patterns

### 4. Documentation System

```
docs/
├── SUMMARY.md (GitBook index)
├── Generated from contracts & tests
├── Category-based organization
└── Progressive difficulty
```

**Generation Process:**
1. Extract JSDoc from contracts
2. Extract test documentation
3. Generate markdown with code tabs
4. Add GitBook navigation
5. Update SUMMARY.md

---

## Automation Workflows

### Workflow 1: Add New Example

```
1. Developer creates contract (contracts/category/NewExample.sol)
2. Developer creates test (test/category/NewExample.ts)
3. Add to EXAMPLES_MAP in create-fhevm-example.ts
4. Add to EXAMPLES_CONFIG in generate-docs.ts
5. npm run create-example new-example ./output/new-example
6. npm run generate-docs new-example
7. git commit and push
8. GitHub Actions runs tests and validates
```

**Key Files Modified:**
- contracts/category/NewExample.sol (new)
- test/category/NewExample.ts (new)
- scripts/create-fhevm-example.ts (add mapping)
- scripts/generate-docs.ts (add config)

### Workflow 2: Update Dependencies

```
1. Update @fhevm/solidity version in package.json
2. npm run update-dependencies
   - Updates all example repos
   - Runs tests for each
   - Generates new docs
3. Review changes
4. git commit
5. Create release tag
6. GitHub Actions publishes updates
```

### Workflow 3: Generate All Artifacts

```
1. npm run generate-all-docs
   - For each example in config
   - Extract and process code
   - Generate markdown
2. Review generated docs
3. Commit docs to git
4. Deploy to documentation site
```

---

## Configuration Management

### EXAMPLES_MAP (create-fhevm-example.ts)

```typescript
const EXAMPLES_MAP: Record<string, ExampleMeta> = {
  "fhe-counter": {
    contract: "contracts/basic/FHECounter.sol",
    test: "test/basic/FHECounter.ts",
    title: "FHE Counter",
    description: "Encrypted counter with FHE operations",
    difficulty: "beginner",
    category: "basic",
  },
  // ... more examples
};
```

**Purpose:**
- Maps CLI example names to file paths
- Defines metadata for each example
- Used by create-fhevm-example.ts script

### EXAMPLES_CONFIG (generate-docs.ts)

```typescript
const EXAMPLES_CONFIG: DocumentationConfig[] = [
  {
    name: "fhe-counter",
    title: "FHE Counter",
    contractPath: "contracts/basic/FHECounter.sol",
    testPath: "test/basic/FHECounter.ts",
    outputPath: "docs/basic/fhe-counter.md",
    category: "basic",
    order: 1,
  },
  // ... more examples
];
```

**Purpose:**
- Maps examples to documentation
- Defines output paths
- Controls documentation order

### package.json (Root)

```json
{
  "name": "fhevm-examples-hub",
  "version": "1.0.0",
  "scripts": {
    "create-example": "ts-node scripts/create-fhevm-example.ts",
    "create-category": "ts-node scripts/create-fhevm-category.ts",
    "generate-docs": "ts-node scripts/generate-docs.ts",
    "update-dependencies": "ts-node scripts/update-dependencies.ts"
  },
  "dependencies": {
    // shared dependencies
  }
}
```

---

## Testing Architecture

### Test Hierarchy

```
Test Environment
├── Mock (Hardhat)
│   ├── Speed: Instant
│   ├── Coverage: All features
│   ├── Accuracy: Simulation
│   └── Cost: Free
├── Enhanced Mock (FHEVM Plugin)
│   ├── Speed: Fast
│   ├── Coverage: All features
│   ├── Accuracy: Realistic
│   └── Cost: Free
└── Real Network (Sepolia)
    ├── Speed: Slow (12-15s/block)
    ├── Coverage: Critical paths only
    ├── Accuracy: Real FHE
    └── Cost: Gas fees required
```

### Test Organization

```
test/
├── fixtures/
│   ├── contracts.ts (common deployments)
│   ├── signers.ts (account setup)
│   └── encrypted-inputs.ts (FHE helpers)
├── basic/
│   ├── FHECounter.ts
│   │   ├── Initialization tests
│   │   ├── Operation tests
│   │   ├── Permission tests
│   │   ├── Edge case tests
│   │   └── Integration tests
│   └── [other basic tests]
└── [other categories]
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
On: push, pull_request

Jobs:
├── test
│   ├── Install dependencies
│   ├── Run linter
│   ├── Compile contracts
│   ├── Run tests
│   └── Upload coverage
├── deploy (main branch only)
│   ├── Deploy to Sepolia
│   ├── Run Sepolia tests
│   └── Update documentation
└── validate
    ├── Check file naming
    ├── Verify configurations
    └── Test scaffolding tools
```

---

## Deployment Architecture

### Example Repository Lifecycle

```
┌─────────────┐
│  Created    │
│ (in memory) │
└─────────────┘
      │
      ▼
┌──────────────────────┐
│  Generated Repo      │ → Local testing
│  ./output/example/   │   npm run test
└──────────────────────┘
      │
      ├─→ Git Clone
      │   ├─→ Feature Branch
      │   ├─→ Pull Request
      │   └─→ Code Review
      │
      ▼
┌──────────────────────┐
│  Published Example   │ → Available on GitHub
│  GitHub Repository   │   Public access
└──────────────────────┘
      │
      ▼
┌──────────────────────┐
│  Deployed Contract   │ → Live on Sepolia
│  Sepolia Testnet     │   Verifiable
└──────────────────────┘
```

---

## Scalability Considerations

### Adding New Examples

1. **Linear Complexity** - Adding examples doesn't affect existing ones
2. **Modular Design** - Each example is independent
3. **Template Reusability** - Base template shared across examples
4. **Automation** - Tools scale with number of examples

### Performance Optimization

1. **Parallel Testing** - Run test suites in parallel
2. **Caching** - Cache dependencies and builds
3. **Selective Testing** - Only test changed examples
4. **Document Generation** - Incremental docs updates

---

## Extension Points

### Adding New Scaffolding Scripts

```typescript
// Create scripts/create-custom-scaffold.ts
// Implement CustomScaffold interface
// Register in package.json scripts

// Example: Create an auction tournament
npm run create-custom-scaffold auction-tournament ./output
```

### Adding New Documentation Formats

```typescript
// Create scripts/generate-docs-custom-format.ts
// Support new output formats (PDF, HTML, etc.)
// Keep GitBook as primary format

// Example: Generate PDF from markdown
npm run generate-docs-pdf
```

### Adding New Test Categories

```typescript
// Create test/security/ directory
// Add security-focused test patterns
// Update test runner configuration

// Example: Formal verification tests
npm run test:security
```

---

## Security Considerations

### Contract Security

1. **FHE Pattern Verification** - Ensure proper permission management
2. **Overflow/Underflow Checks** - Test boundary conditions
3. **Input Validation** - Verify proof integrity
4. **Permission Isolation** - Test access control

### Repository Security

1. **Access Control** - Limit who can merge changes
2. **Code Review** - Require peer review before merge
3. **Branch Protection** - Protect main branch
4. **Signed Commits** - Require GPG signatures

### Deployment Security

1. **Key Management** - Store keys securely in GitHub Secrets
2. **Network Security** - Use HTTPS for all connections
3. **Verification** - Verify contract addresses on Etherscan
4. **Monitoring** - Monitor for unauthorized deployments

---

## Maintenance Strategy

### Regular Updates

- **Weekly:** Monitor for critical dependency updates
- **Monthly:** Update all @fhevm dependencies
- **Quarterly:** Major version reviews
- **Annually:** Architecture review

### Version Management

```
fhevm-examples-hub vX.Y.Z
├── X: Major (breaking changes)
├── Y: Minor (new examples, features)
└── Z: Patch (bug fixes, docs)
```

### Deprecation Policy

1. Announce deprecation (1 month notice)
2. Mark as deprecated in docs
3. Redirect to alternative
4. Remove in next major version

---

## Quality Metrics

### Code Quality

- **Test Coverage:** 80%+ code coverage
- **Linting:** 0 errors, 0 warnings
- **Documentation:** 100% JSDoc coverage
- **Examples:** All compile without warnings

### Performance Metrics

- **Deployment Time:** < 30 seconds
- **Test Execution:** < 5 minutes (all tests)
- **Doc Generation:** < 30 seconds
- **Example Creation:** < 10 seconds

### Developer Experience

- **Setup Time:** < 5 minutes to first test
- **Documentation:** Accessible in < 2 minutes
- **Contribution:** Clear process for adding examples
- **Support:** Community forum + Discord

---

## Conclusion

This reference architecture provides a scalable, maintainable system for building and managing FHEVM examples. By separating concerns (automation, examples, documentation), the system can grow efficiently while maintaining quality and consistency.

Key architectural principles:
1. **Modularity** - Independent, composable components
2. **Automation** - Reduce manual work through scripts
3. **Documentation** - Generated from source of truth
4. **Testing** - Comprehensive coverage at multiple levels
5. **Scalability** - Linear growth with manageable complexity

