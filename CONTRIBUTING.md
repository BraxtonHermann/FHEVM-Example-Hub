# Contributing to FHEVM Example Hub

Thank you for your interest in contributing to the FHEVM Example Hub! This document provides guidelines and instructions for contributing.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Development Process](#development-process)
5. [Coding Standards](#coding-standards)
6. [Submission Guidelines](#submission-guidelines)
7. [Review Process](#review-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or experience level.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Other conduct considered inappropriate

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 20+ and npm 7+
- Git installed and configured
- Familiarity with Solidity and TypeScript
- Understanding of FHE concepts (or willingness to learn)

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/fhevm-examples-hub
cd fhevm-examples-hub

# Install dependencies
npm install

# Run tests to verify setup
npm run test
```

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **New Examples**
   - Additional FHE contract examples
   - Advanced use cases and patterns
   - Educational examples for learners

2. **Bug Fixes**
   - Fixing errors in existing contracts
   - Correcting test failures
   - Resolving documentation issues

3. **Documentation**
   - Improving existing documentation
   - Adding missing explanations
   - Creating tutorials and guides

4. **Testing**
   - Adding test cases
   - Improving test coverage
   - Testing on different networks

5. **Tooling**
   - Enhancing automation scripts
   - Improving developer experience
   - Build system improvements

---

## Development Process

### 1. Find or Create an Issue

- Check existing issues for tasks to work on
- Create a new issue for new features or bugs
- Discuss your approach before major changes

### 2. Fork and Branch

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/yourusername/fhevm-examples-hub

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

Follow the [Coding Standards](#coding-standards) section below.

### 4. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests
npm run test

# Generate documentation
npm run generate-docs

# Build contracts
npm run compile
```

### 5. Commit Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add blind auction example"
```

### Commit Message Format

Use conventional commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks
- `style`: Code style changes

**Examples:**
```
feat(contracts): add ERC7984 freezable token example
fix(tests): correct network check in FHECounter tests
docs(readme): update installation instructions
test(auctions): add edge case tests for blind auction
```

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Coding Standards

### Solidity Contracts

#### File Structure

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

// Imports
import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";

// Contract
/// @title Contract Title
/// @notice Brief description
/// @dev Technical details
contract Example {
  // State variables
  // Events
  // Modifiers
  // Constructor
  // External functions
  // Public functions
  // Internal functions
  // Private functions
}
```

#### Naming Conventions

- Contracts: PascalCase (`FHECounter`, `BlindAuction`)
- Functions: camelCase (`increment`, `placeBid`)
- Variables: camelCase with underscore prefix for private (`_count`, `_balance`)
- Constants: UPPER_SNAKE_CASE (`MAX_SUPPLY`, `MIN_BID`)
- Events: PascalCase (`Transfer`, `BidPlaced`)

#### Documentation

Always include comprehensive JSDoc:

```solidity
/// @notice User-facing description
/// @dev Developer-focused technical details
/// @param paramName Description of parameter
/// @return Description of return value
function example(uint256 paramName) external returns (uint256) {
  // Implementation
}
```

#### Permission Management

Always grant permissions after FHE operations:

```solidity
euint32 result = FHE.add(a, b);
FHE.allowThis(result);
FHE.allow(result, msg.sender);
```

### TypeScript Tests

#### File Structure

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";

describe("ContractName", function () {
  // Setup
  let contract: ContractName;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    // Deploy contract
  });

  describe("Feature Category", function () {
    it("should perform expected behavior", async function () {
      // Test implementation
    });
  });
});
```

#### Test Guidelines

1. **Always include network checks:**
```typescript
if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
  this.skip();
}
```

2. **Use descriptive names:**
```typescript
it("should increment counter by encrypted value", async function () {
  // Test
});
```

3. **Test categories:**
   - Deployment
   - Happy path
   - Edge cases
   - Permissions
   - Error handling

### Code Style

We use automated formatters and linters:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

#### General Guidelines

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use trailing commas in multi-line structures
- Prefer `const` over `let` when possible
- Use TypeScript strict mode

---

## Submission Guidelines

### Pull Request Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the style guidelines
- [ ] All tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test addition/update

## Testing
How have you tested these changes?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes
```

### Documentation Requirements

For new examples:

1. **Contract Documentation:**
   - Comprehensive JSDoc comments
   - Explain FHE operations used
   - Document permission management

2. **Test Documentation:**
   - Test descriptions explain what's being tested
   - Include comments for complex setup

3. **README Update:**
   - Add example to main README
   - Update example count if applicable

4. **Generated Docs:**
   - Run `npm run generate-docs`
   - Verify generated documentation is correct
   - Check SUMMARY.md is updated

---

## Review Process

### What to Expect

1. **Initial Review** (1-3 days)
   - Maintainer reviews your PR
   - Automated checks run (tests, linting)
   - Feedback provided if changes needed

2. **Discussion** (as needed)
   - Address reviewer comments
   - Make requested changes
   - Push updates to your branch

3. **Approval** (1-2 days after changes)
   - Maintainer approves PR
   - Automated final checks run

4. **Merge** (immediate after approval)
   - PR merged into main branch
   - Your contribution is live!

### Review Criteria

Reviewers will check:

- **Code Quality:** Clean, readable, well-structured
- **Functionality:** Works as intended, no bugs
- **Tests:** Comprehensive coverage, all passing
- **Documentation:** Clear, accurate, complete
- **Security:** No vulnerabilities or unsafe patterns
- **Performance:** Efficient FHE operations
- **Consistency:** Matches existing codebase style

---

## Development Guidelines

### Adding New Examples

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed instructions.

Quick checklist:

1. Create contract in `contracts/category/`
2. Create test in `test/category/`
3. Add to `EXAMPLES_MAP` in `scripts/create-fhevm-example.ts`
4. Add to `EXAMPLES_CONFIG` in `scripts/generate-docs.ts`
5. Run tests: `npm run test`
6. Generate docs: `npm run generate-docs`
7. Create pull request

### Updating Examples

1. Make changes to contract and/or tests
2. Update documentation if needed
3. Run full test suite
4. Regenerate documentation
5. Submit pull request with clear description

---

## Community

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **Pull Requests:** Code contributions and discussions
- **Forum:** [Zama Community](https://community.zama.ai)
- **Discord:** [Developer Community](https://discord.gg/zama)

### Getting Help

If you need help:

1. Check existing documentation
2. Search closed issues for similar problems
3. Ask in community forum or Discord
4. Create a new issue with detailed information

---

## Recognition

Contributors are recognized in the following ways:

- Listed in GitHub contributors
- Mentioned in release notes
- Acknowledged in documentation
- Featured in community announcements

---

## License

By contributing to this project, you agree that your contributions will be licensed under the BSD-3-Clause-Clear license.

---

## Questions?

If you have questions about contributing:

- Read the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Check existing issues and pull requests
- Ask in the community forum
- Create a new issue with the "question" label

Thank you for contributing to FHEVM Example Hub! 🎉
