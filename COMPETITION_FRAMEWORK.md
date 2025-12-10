# FHEVM Example Hub Competition Framework

## Overview

This document outlines the comprehensive framework for building Fully Homomorphic Encryption Virtual Machine (FHEVM) example repositories. The competition challenges developers to create standalone, production-ready examples that demonstrate privacy-preserving smart contracts.

**Competition Period:** December 1, 2025 - December 31, 2025
**Prize Pool:** $10,000 USD
**Submission Deadline:** December 31, 2025 (23:59 AOE)

---

## Competition Objectives

The primary goal is to develop a comprehensive set of standalone FHEVM example repositories that:

1. **Demonstrate Clear Concepts** - Each example focuses on one specific FHE concept
2. **Include Complete Tests** - Comprehensive test suites showing correct usage and common pitfalls
3. **Provide Clean Documentation** - Self-contained, developer-friendly documentation
4. **Enable Automated Scaffolding** - Tools for generating new examples quickly
5. **Support Easy Maintenance** - Framework for updating dependencies across examples

---

## Core Requirements

### 1. Project Structure & Simplicity

#### Repository Organization
- **Use Hardhat** - Single build framework for all examples
- **One Example Per Repository** - No monorepo structures
- **Minimal Project Layout:**
  ```
  your-example-repo/
  ├── contracts/
  │   └── YourExample.sol
  ├── test/
  │   └── YourExample.ts
  ├── tasks/
  │   └── interact.ts
  ├── hardhat.config.ts
  ├── tsconfig.json
  ├── package.json
  └── README.md
  ```

#### Configuration Files
- `hardhat.config.ts` - Network configuration (Sepolia testnet)
- `tsconfig.json` - TypeScript ES2022 with strict mode
- `package.json` - Dependencies and npm scripts
- `.solhintrc` - Solidity linting
- `.eslintrc` - TypeScript linting

#### Naming Conventions
- Contract files: `YourFeatureName.sol` (PascalCase)
- Test files: `YourFeatureName.ts` (matches contract name)
- Task files: descriptive names in camelCase

---

### 2. Scaffolding & Automation

#### CLI Tool Requirements

Create automation tools that can:

1. **Clone Base Template**
   - Reference: Base Hardhat template
   - Customize network configurations
   - Update dependency versions

2. **Generate Project Structure**
   - Create directory hierarchy
   - Copy contract from contracts directory
   - Copy test from test directory
   - Generate deployment script

3. **Auto-Generate Documentation**
   - Extract JSDoc/TSDoc comments from contracts
   - Create markdown README.md
   - Generate interactive examples
   - Support GitBook format

#### Example Implementation Pattern

```typescript
// Pseudocode for scaffolding tool
async function createFHEVMExample(exampleName: string, outputDir: string) {
  1. Copy base template
  2. Extract contract from examples/contracts/
  3. Extract test from examples/test/
  4. Update hardhat.config with example metadata
  5. Generate README.md from contract JSDoc
  6. Create deployment script with correct contract name
  7. Update package.json with example info
}
```

#### Supported Example Categories

- **Basic Concepts**: FHE operations, encryption, decryption
- **Access Control**: FHE.allow(), FHE.allowThis(), permission models
- **Auctions**: Blind auctions, Dutch auction variants
- **Tokens**: ERC7984 implementations, token operations
- **Gaming**: Confidential game logic
- **Finance**: Vesting wallets, financial instruments
- **Advanced**: Complex multi-operation patterns

---

### 3. Example Categories & Implementation

#### A. Basic Examples

**FHE Counter**
- **Purpose:** Introduce FHE operations on state
- **Concepts:** euint32, FHE.add(), FHE.sub()
- **Test Pattern:**
  ```typescript
  - Deploy contract
  - Create encrypted input
  - Call increment/decrement
  - Verify encrypted state update
  - Decrypt and assert results
  ```
- **Key Learning:** FHE state management and encrypted arithmetic

**Encryption Examples**
- Single value encryption (`encrypt-single-value`)
- Multiple value encryption (`encrypt-multiple-values`)
- **Concepts:** externalEuint types, input proofs, binding

**Decryption Examples**
- User decryption single/multiple values
- Public decryption single/multiple values
- **Concepts:** FHE.allowThis(), user key management, public outputs

#### B. Access Control & Permissions

**Access Control Pattern**
- **Key Concept:** FHE.allow() and FHE.allowTransient()
- **Implementation:**
  ```solidity
  euint32 encrypted_value = FHE.add(a, b);
  FHE.allow(encrypted_value, msg.sender);
  FHE.allowThis(encrypted_value); // Contract access
  ```

**Input Proof Explanation**
- Zero-knowledge proofs for encrypted inputs
- Why proofs are necessary for binding
- Proper usage patterns

**Anti-patterns Documentation**
- View functions with encrypted returns (prohibited)
- Missing FHE.allow() permissions
- Incorrect encryption binding
- Handle lifecycle mismanagement

#### C. Advanced Operations

**FHE-based Conditional Logic**
```solidity
// Example pattern
ebool condition = FHE.ge(encrypted_value, threshold);
euint32 result = FHE.select(condition, trueValue, falseValue);
```

**Blind Auction**
- Confidential bid submission
- Encrypted bid comparison
- Sealed reveal mechanism
- Winner determination without bid disclosure

**Dutch Auction**
- Time-based price reduction on encrypted values
- Confidential buyer matching
- Privacy-preserving settlement

#### D. Token & Finance Examples

**ERC7984 Standard Implementation**
- Confidential token balances
- Encrypted transfers
- Operator model with time bounds

**Token Variants**
- ERC7984 with freezing mechanism
- ERC7984 with access restrictions
- ERC7984 with role-based access

**Vesting Wallet**
- Confidential token vesting schedules
- Linear vesting curve
- Cliff period support
- Release mechanisms

#### E. Gaming Examples

**Game Logic Pattern**
- Encrypted player moves
- Confidential game state
- Hidden information preservation
- Privacy-preserving winner determination

---

### 4. Testing Strategy

#### Test File Organization

```typescript
// Standard test structure
describe("YourFeature", () => {
  let contract: YourFeature;
  let owner: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async () => {
    // Deploy with fixture
  });

  describe("Basic Operations", () => {
    it("should perform operation correctly", async () => {
      // Test implementation
    });
  });

  describe("Access Control", () => {
    it("should enforce permissions", async () => {
      // Permission test
    });
  });

  describe("Edge Cases", () => {
    it("should handle boundary conditions", async () => {
      // Edge case test
    });
  });
});
```

#### Test Coverage Requirements

1. **Happy Path Tests** - Standard usage scenarios
2. **Permission Tests** - Access control enforcement
3. **Edge Case Tests** - Boundary conditions, overflow/underflow
4. **Error Handling** - Invalid inputs, failed operations
5. **Integration Tests** - Multi-contract interactions

#### Mock Environment vs Real Network

```typescript
// Local/mock tests (skip on real networks)
if (hre.network.name === "hardhat" || hre.network.name === "anvil") {
  it("should work in FHE mock environment", async () => {
    const encrypted = fhevm.createEncryptedInput();
    const decrypted = fhevm.userDecryptEuint(encrypted);
  });
}

// Real network tests (only on Sepolia)
if (hre.network.name === "sepolia") {
  it("should work on Sepolia testnet", async () => {
    // Longer timeout for real blockchain
  });
}
```

---

### 5. Documentation Strategy

#### JSDoc Comment Style for Contracts

```solidity
/// @title Brief contract description
/// @notice User-facing contract description
/// @dev Technical implementation details
contract YourContract {
  /// @notice Function purpose
  /// @param value Parameter description
  /// @return Result description
  function yourFunction(uint32 value) external returns (euint32) {
    // Implementation
  }
}
```

#### Auto-Generated Documentation

Documentation generator should:
1. Extract contract and test code
2. Create GitBook-compatible markdown
3. Generate tabbed code examples (contract + test)
4. Add file placement hints
5. Update SUMMARY.md automatically

#### README Structure

```markdown
# Your Example Name

## Overview
[Brief description of what this example demonstrates]

## Concepts Covered
- [Concept 1]
- [Concept 2]
- [Concept 3]

## Smart Contract

[Contract code with annotations]

## Test Suite

[Test code showing usage patterns]

## How to Run

```bash
npm install
npm run test
```

## Key Takeaways
[Main lessons from this example]

## Common Pitfalls
[What not to do]

## Further Reading
[Related topics and resources]
```

#### Documentation Metadata

Include tags in code for organization:
```typescript
/**
 * @chapter access-control
 * @difficulty intermediate
 * @relatedExamples fhe-counter, user-decryption
 */
```

---

## Example Implementation Reference

### Directory Structure for Examples Collection

```
fhevm-examples-hub/
├── scripts/
│   ├── create-fhevm-example.ts      # Single example generator
│   ├── create-fhevm-category.ts     # Category project generator
│   └── generate-docs.ts              # Documentation generator
├── contracts/
│   ├── basic/
│   │   ├── FHECounter.sol
│   │   ├── encrypt/
│   │   │   ├── EncryptSingleValue.sol
│   │   │   └── EncryptMultipleValues.sol
│   │   ├── decrypt/
│   │   │   ├── UserDecryptSingleValue.sol
│   │   │   ├── UserDecryptMultipleValues.sol
│   │   │   ├── PublicDecryptSingleValue.sol
│   │   │   └── PublicDecryptMultipleValues.sol
│   │   └── fhe-operations/
│   │       ├── FHEAdd.sol
│   │       └── FHEIfThenElse.sol
│   ├── auctions/
│   │   ├── BlindAuction.sol
│   │   └── ConfidentialDutchAuction.sol
│   ├── tokens/
│   │   ├── ERC7984Example.sol
│   │   ├── ERC7984Freezable.sol
│   │   └── ERC7984Rwa.sol
│   └── advanced/
│       └── YourAdvancedExample.sol
├── test/
│   └── [mirrors contract structure]
├── docs/
│   ├── SUMMARY.md
│   └── [auto-generated .md files]
├── fhevm-hardhat-template/
│   ├── contracts/
│   ├── test/
│   ├── tasks/
│   ├── hardhat.config.ts
│   └── package.json
├── package.json
├── README.md
└── bounty-requirements.md
```

---

## Scaffolding Tool Examples

### Creating a Single Example

```bash
npm run create-example fhe-counter ./output/fhe-counter
```

**Output Structure:**
```
output/fhe-counter/
├── contracts/FHECounter.sol
├── test/FHECounter.ts
├── tasks/interact.ts
├── hardhat.config.ts
├── package.json
├── README.md (auto-generated)
└── [other config files]
```

### Creating a Category Project

```bash
npm run create-category basic ./output/basic-examples
```

**Output Structure:**
```
output/basic-examples/
├── contracts/
│   ├── FHECounter.sol
│   ├── EncryptSingleValue.sol
│   ├── EncryptMultipleValues.sol
│   ├── UserDecryptSingleValue.sol
│   ├── UserDecryptMultipleValues.sol
│   ├── PublicDecryptSingleValue.sol
│   ├── PublicDecryptMultipleValues.sol
│   ├── FHEAdd.sol
│   └── FHEIfThenElse.sol
├── test/
│   └── [all corresponding tests]
├── tasks/deploy.ts (unified deployment)
└── README.md (comprehensive category guide)
```

### Generating Documentation

```bash
npm run generate-docs fhe-counter    # Single example
npm run generate-all-docs             # All examples
```

---

## Judging Criteria

### 1. Code Quality (25%)
- Clean, readable Solidity code
- Proper error handling and validation
- Security best practices
- TypeScript type safety
- Following style conventions

### 2. Automation Completeness (20%)
- Robust scaffolding tools
- Reliable documentation generation
- Error handling in automation
- Clear usage instructions
- Maintenance tool quality

### 3. Example Quality (20%)
- Clear demonstration of concepts
- Well-chosen use cases
- Proper FHE patterns
- Production-ready code
- Edge case handling

### 4. Documentation (15%)
- Comprehensive README files
- Clear explanations of concepts
- Guided learning path
- Code comments and JSDoc
- Visual diagrams where helpful

### 5. Maintenance & Scalability (10%)
- Tools for version updates
- Dependency management strategy
- Clear upgrade procedures
- Performance considerations

### 6. Innovation Bonus (10%)
- Creative example implementations
- Advanced FHE patterns
- Unique use cases
- Developer experience improvements
- Additional tooling

---

## Bonus Point Opportunities

1. **Creative Examples** - Implement examples beyond base requirements
2. **Advanced Patterns** - Demonstrate complex FHE interactions
3. **Clean Automation** - Particularly elegant and maintainable scripts
4. **Comprehensive Testing** - Extensive edge case coverage
5. **Error Demonstrations** - Examples showing common mistakes
6. **Category Organization** - Well-structured example hierarchy
7. **Maintenance Tools** - Automated dependency update workflows
8. **Video Documentation** - Walkthrough tutorials for examples
9. **Interactive Demos** - Web-based example runners
10. **Performance Optimization** - Gas-efficient FHE operations

---

## Submission Requirements

### Mandatory Deliverables

1. **Base Template Repository**
   - Complete Hardhat configuration
   - Updated dependencies (@fhevm/solidity latest)
   - Example contract and tests
   - Deployment scripts

2. **Scaffolding Tools** (TypeScript)
   - `create-fhevm-example.ts` - Single example generator
   - `create-fhevm-category.ts` - Category generator
   - `generate-docs.ts` - Documentation generator
   - Supporting utility functions

3. **Example Contracts** (minimum 7-10)
   - Basic category (at least 5 examples)
   - Advanced category (at least 2 examples)
   - Well-documented with JSDoc

4. **Test Suites**
   - Comprehensive tests for each example
   - Mock and real network test variants
   - Edge case and error handling tests

5. **Documentation**
   - Auto-generated per example
   - SUMMARY.md with navigation
   - Category organization
   - Developer guide for adding examples

6. **Demonstration Video** (MANDATORY)
   - Project overview (1-2 minutes)
   - Key features demonstration (2-3 minutes)
   - Scaffolding tools in action (2-3 minutes)
   - Testing and deployment walkthrough (2-3 minutes)
   - Total: 7-11 minutes

---

## Reference Implementation Patterns

### FHE Counter Pattern

```solidity
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Counter
/// @notice Demonstrates encrypted state management
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.add(_count, encryptedValue);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }

  function getCount() external view returns (euint32) {
    return _count;
  }
}
```

### Test Pattern

```typescript
describe("FHECounter", () => {
  it("should increment counter", async () => {
    const [owner] = await ethers.getSigners();
    const contract = await FHECounter.deploy();

    const input = fhevm.createEncryptedInput();
    input.add32(5);
    const encrypted = input.encrypt();

    const tx = await contract.increment(encrypted.data, encrypted.proof);
    await tx.wait();

    const result = await contract.getCount();
    const decrypted = fhevm.userDecryptEuint(result);
    expect(decrypted).to.equal(5);
  });
});
```

---

## Development Workflow

### For Adding a New Example

1. **Create Contract** - Write `contracts/category/YourExample.sol`
2. **Create Tests** - Write `test/category/YourExample.ts`
3. **Register Example** - Add to EXAMPLES_MAP in create-fhevm-example.ts
4. **Register Documentation** - Add to EXAMPLES_CONFIG in generate-docs.ts
5. **Generate Artifacts** - Run creation and documentation tools
6. **Verify Output** - Test scaffolded repository works

### For Maintenance

1. **Dependency Updates** - Update @fhevm/solidity version
2. **Run Migration Script** - Regenerate all examples
3. **Test All Examples** - Verify nothing broke
4. **Update Documentation** - Reflect changes
5. **Commit Changes** - Document in changelog

---

## Technical Stack

- **Language:** TypeScript, Solidity 0.8.24+
- **Framework:** Hardhat with Hardhat Deploy
- **FHE Library:** @fhevm/solidity, @fhevm/hardhat-plugin
- **Testing:** Chai, Mocha
- **Documentation:** Markdown, GitBook compatible
- **Build:** TypeScript compiler, Solidity compiler
- **Package Manager:** npm 7.0.0+

---

## Community & Support

- **Forum:** Community developer support
- **Discord:** Real-time development help
- **GitHub:** Source code and issues
- **Documentation:** FHEVM protocol specs

---

## Example Repository Checklist

Before submission, verify:

- [ ] All contracts compile without errors
- [ ] All tests pass (both mock and Sepolia)
- [ ] Documentation generates correctly
- [ ] Scaffolding tools work as expected
- [ ] README is comprehensive and clear
- [ ] Code follows style guidelines
- [ ] No security vulnerabilities
- [ ] Video demonstration is complete
- [ ] Repository is public and accessible
- [ ] All files properly named (no dapp/case suffixes)

---

## Conclusion

This competition framework provides everything needed to build production-quality FHEVM examples. By following these guidelines, participants will create valuable educational resources that advance the FHE ecosystem while demonstrating their technical expertise.

The combination of well-structured examples, automated tooling, and comprehensive documentation creates a sustainable system for growing the FHEVM developer community.

---

**Competition Support Resources:**
- FHEVM Documentation & Specification
- Zama Community Forum
- GitHub Issue Tracker
- Discord Community Channel

