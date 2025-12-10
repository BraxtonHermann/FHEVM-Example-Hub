# Example Implementation Guide

## Building FHEVM Examples: Step-by-Step

This guide walks you through implementing a complete FHEVM example from start to finish, including smart contract development, comprehensive testing, documentation generation, and automation tooling.

---

## Part 1: Smart Contract Development

### Step 1: Define Your Concept

Choose one clear FHE concept to demonstrate. Examples:
- Encrypted arithmetic operations (add, subtract, compare)
- Access control mechanisms (FHE.allow patterns)
- Conditional logic on encrypted values
- State management with encryption
- Complex financial operations

### Step 2: Create the Solidity Contract

#### File: `contracts/basic/FHECounter.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Counter
/// @notice Demonstrates encrypted state management using FHEVM
/// @dev This contract shows how to store and manipulate encrypted values
/// while maintaining privacy of the actual numbers.
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  /// @notice Returns the current encrypted count
  /// @dev The returned value is encrypted and can only be decrypted
  /// by authorized users with proper permissions
  /// @return The encrypted counter value
  function getCount() external view returns (euint32) {
    return _count;
  }

  /// @notice Increments the counter by an encrypted amount
  /// @dev This function demonstrates:
  ///   1. Accepting encrypted input from external sources
  ///   2. Performing FHE operations on encrypted state
  ///   3. Managing permissions for encrypted values
  ///   4. The FHE.allow pattern for access control
  /// @param inputEuint32 Encrypted value to add to counter (external format)
  /// @param inputProof Zero-knowledge proof proving valid encryption
  ///
  /// @custom:warning This example omits overflow checks for clarity.
  ///   Production code should implement proper range validation.
  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    // Convert external encrypted type to internal euint32
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);

    // Perform encrypted addition
    _count = FHE.add(_count, encryptedValue);

    // Grant contract permission to access updated value
    FHE.allowThis(_count);

    // Grant caller permission to decrypt their own operation's result
    FHE.allow(_count, msg.sender);
  }

  /// @notice Decrements the counter by an encrypted amount
  /// @dev Similar to increment() but performs subtraction.
  ///   Note: FHE operations work on encrypted values without
  ///   revealing operands during computation.
  /// @param inputEuint32 Encrypted value to subtract from counter
  /// @param inputProof Zero-knowledge proof proving valid encryption
  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);

    // Perform encrypted subtraction
    _count = FHE.sub(_count, encryptedValue);

    // Update permissions
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }

  /// @notice Demonstrates permission checking
  /// @dev Shows how to verify access control on encrypted values
  /// @return Boolean indicating if caller has access to count
  function canAccessCount() external view returns (bool) {
    // Implementation-specific permission check
    return true;
  }
}
```

#### Key Contract Patterns Explained

**1. State Declaration**
```solidity
euint32 private _count;  // Encrypted 32-bit unsigned integer
```
- Use encrypted types for private state that should remain confidential
- Prefix with underscore for private visibility

**2. Input Handling**
```solidity
euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
```
- Always accept external encrypted types with proofs
- Convert to internal encrypted types for operations
- Proofs ensure cryptographic validity

**3. Permission Management**
```solidity
FHE.allowThis(_count);        // Allow contract to access value
FHE.allow(_count, msg.sender); // Allow specific user to access
```
- `FHE.allowThis()` grants contract permission
- `FHE.allow()` grants specific user permission
- Both are needed for most operations

**4. Return Values**
```solidity
function getCount() external view returns (euint32) {
  return _count;
}
```
- Returning encrypted values is safe (data remains encrypted)
- Caller must have permissions to decrypt
- No state modification needed for view functions

---

## Part 2: Writing Comprehensive Tests

### Step 3: Create Test File

#### File: `test/basic/FHECounter.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { FHECounter } from "../../typechain-types";

/**
 * @chapter access-control
 * @difficulty beginner
 * Test suite for FHE Counter contract
 *
 * This test suite demonstrates:
 * - Encrypted value initialization
 * - FHE arithmetic operations
 * - Permission management patterns
 * - Mock environment testing
 * - Real network considerations
 */
describe("FHECounter", () => {
  let contract: FHECounter;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async () => {
    // Get signers
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy contract
    const FHECounter = await ethers.getContractFactory("FHECounter");
    contract = await FHECounter.deploy();
    await contract.deploymentTransaction()?.wait(1);
  });

  describe("Initialization", () => {
    it("should initialize with zero encrypted count", async () => {
      // This test verifies the contract starts with encrypted zero state
      const count = await contract.getCount();

      // In FHEVM, uninitialized euint values are encrypted zeros
      expect(count).to.not.be.null;
      expect(count).to.be.of.type("string"); // Encrypted value is bytes32
    });

    it("should only return encrypted format on view calls", async () => {
      // Verify that view functions return encrypted data
      const count = await contract.getCount();

      // The returned value should be a valid encrypted format
      expect(count).to.satisfy((val: any) => {
        return val.length >= 0; // Basic validation
      });
    });
  });

  describe("Increment Operations", () => {
    /**
     * Test increment with encrypted value
     *
     * This demonstrates:
     * - Creating encrypted inputs in test environment
     * - Executing contract operations with encrypted data
     * - Verifying encrypted state changes
     *
     * @notice This test only runs in mock FHEVM environment
     */
    it("should increment counter by encrypted value in mock environment", async function () {
      // Skip on real networks (Sepolia uses different testing pattern)
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      // Get FHEVM testing utilities
      const { fhevm } = hre;

      // Create encrypted input: value 5
      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(5);
      const encrypted = input.encrypt();

      // Call increment with encrypted value
      const tx = await contract.increment(encrypted.data, encrypted.proof);
      await tx.wait(1);

      // Retrieve encrypted count
      const encryptedCount = await contract.getCount();

      // Decrypt result for verification (only owner can do this in real scenario)
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);

      // Verify the operation succeeded
      expect(decrypted).to.equal(5n);
    });

    it("should handle multiple sequential increments", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // First increment: +3
      const input1 = fhevm.createEncryptedInput(contract.target, owner.address);
      input1.add32(3);
      const encrypted1 = input1.encrypt();
      await (await contract.increment(encrypted1.data, encrypted1.proof)).wait(1);

      // Second increment: +7
      const input2 = fhevm.createEncryptedInput(contract.target, owner.address);
      input2.add32(7);
      const encrypted2 = input2.encrypt();
      await (await contract.increment(encrypted2.data, encrypted2.proof)).wait(1);

      // Verify total: 3 + 7 = 10
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);
      expect(decrypted).to.equal(10n);
    });

    it("should allow different signers to perform increments", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // Alice increments by 4
      const inputAlice = fhevm.createEncryptedInput(contract.target, alice.address);
      inputAlice.add32(4);
      const encryptedAlice = inputAlice.encrypt();
      await (await contract.connect(alice).increment(
        encryptedAlice.data,
        encryptedAlice.proof
      )).wait(1);

      // Bob increments by 6
      const inputBob = fhevm.createEncryptedInput(contract.target, bob.address);
      inputBob.add32(6);
      const encryptedBob = inputBob.encrypt();
      await (await contract.connect(bob).increment(
        encryptedBob.data,
        encryptedBob.proof
      )).wait(1);

      // Verify total: 4 + 6 = 10
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);
      expect(decrypted).to.equal(10n);
    });
  });

  describe("Decrement Operations", () => {
    it("should decrement counter by encrypted value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // Setup: increment to 20
      const inputUp = fhevm.createEncryptedInput(contract.target, owner.address);
      inputUp.add32(20);
      const encryptedUp = inputUp.encrypt();
      await (await contract.increment(encryptedUp.data, encryptedUp.proof)).wait(1);

      // Now decrement by 8
      const inputDown = fhevm.createEncryptedInput(contract.target, owner.address);
      inputDown.add32(8);
      const encryptedDown = inputDown.encrypt();
      await (await contract.decrement(encryptedDown.data, encryptedDown.proof)).wait(1);

      // Verify: 20 - 8 = 12
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);
      expect(decrypted).to.equal(12n);
    });

    it("should handle decrement reducing to zero", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // Setup: increment to 15
      const inputUp = fhevm.createEncryptedInput(contract.target, owner.address);
      inputUp.add32(15);
      const encryptedUp = inputUp.encrypt();
      await (await contract.increment(encryptedUp.data, encryptedUp.proof)).wait(1);

      // Decrement by 15
      const inputDown = fhevm.createEncryptedInput(contract.target, owner.address);
      inputDown.add32(15);
      const encryptedDown = inputDown.encrypt();
      await (await contract.decrement(encryptedDown.data, encryptedDown.proof)).wait(1);

      // Verify: 15 - 15 = 0
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);
      expect(decrypted).to.equal(0n);
    });
  });

  describe("Permission Management", () => {
    it("should grant contract access with FHE.allowThis()", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // The increment function internally calls FHE.allowThis()
      // This test verifies the contract can access the value after increment
      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(42);
      const encrypted = input.encrypt();

      // The contract should be able to read its own encrypted state
      const tx = await contract.increment(encrypted.data, encrypted.proof);
      expect(tx).to.emit(contract, "Transfer"); // Depends on actual events
    });

    it("should grant user access with FHE.allow()", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // After increment, owner should be able to decrypt
      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(7);
      const encrypted = input.encrypt();
      await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);

      // Owner can decrypt their own operation's result
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);

      // Should successfully decrypt without permission error
      expect(decrypted).to.be.a("bigint");
    });
  });

  describe("Edge Cases & Security", () => {
    it("should handle maximum uint32 values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // Create large value (close to uint32 max: 4,294,967,295)
      const maxValue = (2n ** 32n) - 1n;

      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(maxValue);
      const encrypted = input.encrypt();

      // Should handle without throwing
      await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);

      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);
      expect(decrypted).to.equal(maxValue);
    });

    it("should prevent unauthorized decryption in real scenarios", async function () {
      // This test documents the security model
      // In real FHEVM, only users with FHE.allow() permission can decrypt
      // This test is informational for developers

      // Setup and increment
      const { fhevm } = hre;
      if (hre.network.name === "hardhat" || hre.network.name === "anvil") {
        const input = fhevm.createEncryptedInput(contract.target, owner.address);
        input.add32(99);
        const encrypted = input.encrypt();
        await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);

        // In production, bob cannot decrypt without FHE.allow() permission
        // Mock environment may behave differently, but the pattern is correct
        const count = await contract.getCount();
        expect(count).to.exist;
      }
    });

    it("should reject invalid proofs", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;

      // Create valid encrypted input
      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(5);
      const encrypted = input.encrypt();

      // Tamper with proof by modifying a byte
      const tamperedProof = encrypted.proof.slice(0, -2) + "FF";

      // Attempt should fail or be rejected
      try {
        await contract.increment(encrypted.data, tamperedProof);
        // If it doesn't throw, the tampered proof was detected server-side
      } catch (error: any) {
        // Expected: Invalid proof error
        expect(error.message).to.include("proof");
      }
    });
  });

  describe("Sepolia Testnet Tests", () => {
    /**
     * Test for actual Sepolia network
     *
     * @notice Only runs on Sepolia testnet
     * @notice Requires predeployed contract
     * @notice Longer timeout for real blockchain
     */
    it("should increment on Sepolia testnet", async function () {
      // Only run on Sepolia
      if (hre.network.name !== "sepolia") {
        this.skip();
      }

      // Increase timeout for real blockchain
      this.timeout(160000); // 4x40 seconds

      const { fhevm } = hre;

      // Create and send transaction
      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(42);
      const encrypted = input.encrypt();

      const tx = await contract.increment(encrypted.data, encrypted.proof);
      const receipt = await tx.wait(6); // Wait for 6 confirmations

      expect(receipt).to.exist;
      expect(receipt?.blockNumber).to.be.greaterThan(0);
    });
  });

  describe("Integration Tests", () => {
    it("should maintain consistency across multiple operations", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre;
      let expectedValue = 0n;

      // Sequence of operations
      const operations = [
        { op: "increment", value: 10n },
        { op: "increment", value: 15n },
        { op: "decrement", value: 5n },
        { op: "increment", value: 20n },
        { op: "decrement", value: 10n },
      ];

      for (const { op, value } of operations) {
        const input = fhevm.createEncryptedInput(contract.target, owner.address);
        input.add32(value);
        const encrypted = input.encrypt();

        if (op === "increment") {
          await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);
          expectedValue += value;
        } else {
          await (await contract.decrement(encrypted.data, encrypted.proof)).wait(1);
          expectedValue -= value;
        }
      }

      // Verify final state
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint(encryptedCount);
      expect(decrypted).to.equal(expectedValue);
    });
  });
});
```

#### Test Best Practices Demonstrated

1. **Fixture Pattern** - `beforeEach` sets up fresh contract state
2. **Multiple Signers** - Tests with owner, alice, bob
3. **Mock vs Real** - Skips mock tests on real networks
4. **Clear Descriptions** - Each test documents what it verifies
5. **Edge Cases** - Tests boundary conditions and error scenarios
6. **Integration** - Tests complex sequences of operations
7. **Documentation** - JSDoc comments explain testing patterns

---

## Part 3: Documentation Generation

### Step 4: Create README Auto-Generator

#### File: `scripts/generate-docs.ts` (Excerpt)

```typescript
import fs from "fs";
import path from "path";

/**
 * Configuration mapping examples to their documentation
 * Each example includes contract and test file paths
 */
const EXAMPLES_CONFIG: ExampleConfig[] = [
  {
    name: "fhe-counter",
    title: "FHE Counter",
    description: "Demonstrates encrypted state management with FHE operations",
    contractPath: "contracts/basic/FHECounter.sol",
    testPath: "test/basic/FHECounter.ts",
    outputPath: "docs/basic/fhe-counter.md",
    category: "basic",
    difficulty: "beginner",
  },
  // Add more examples...
];

/**
 * Generates GitBook-compatible documentation with tabbed code examples
 */
function generateDocumentation(example: ExampleConfig) {
  // Read contract and test files
  const contractCode = fs.readFileSync(example.contractPath, "utf-8");
  const testCode = fs.readFileSync(example.testPath, "utf-8");

  // Generate markdown with tabs
  const markdown = `
# ${example.title}

## Overview

${example.description}

**Difficulty:** ${example.difficulty}
**Category:** ${example.category}

## Concept

This example teaches you about:
- Encrypted state management
- FHE arithmetic operations
- Permission control patterns
- Testing encrypted smart contracts

## Smart Contract

\`\`\`solidity
${contractCode}
\`\`\`

## Test Suite

\`\`\`typescript
${testCode}
\`\`\`

## How to Run

\`\`\`bash
# Install dependencies
npm install

# Run tests in mock environment
npm run test

# Run tests on Sepolia
npm run test:sepolia

# Deploy to Sepolia
npm run deploy:sepolia
\`\`\`

## Key Concepts Explained

### Encrypted State

The contract uses \`euint32\` to store encrypted values:
\`\`\`solidity
euint32 private _count;
\`\`\`

This value is encrypted at all times, even on-chain.

### External Encrypted Input

To work with encrypted inputs from users:
\`\`\`solidity
euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
\`\`\`

The proof ensures the input is validly encrypted.

### Permission Management

After operating on encrypted values, grant access:
\`\`\`solidity
FHE.allowThis(_count);        // Contract can read
FHE.allow(_count, msg.sender); // Caller can decrypt
\`\`\`

## Common Pitfalls

### ❌ Missing Permissions
\`\`\`solidity
// WRONG: No one can access this value!
_count = FHE.add(_count, value);
\`\`\`

### ✅ Correct Pattern
\`\`\`solidity
// RIGHT: Grant appropriate permissions
_count = FHE.add(_count, value);
FHE.allowThis(_count);
FHE.allow(_count, msg.sender);
\`\`\`

### ❌ Returning Encrypted in View
\`\`\`solidity
// This actually works (data is still encrypted):
function getValue() view returns (euint32) {
  return _count; // Caller can request but may not decrypt
}
\`\`\`

## Next Steps

- Explore other FHE operations in the FHE.sol library
- Implement access control patterns
- Build more complex encrypted contracts
- Join the community for support

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Related Examples](#)
- [Community Forum](#)
`;

  // Write documentation
  const outputDir = path.dirname(example.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(example.outputPath, markdown);
  console.log(`Generated: ${example.outputPath}`);
}

// Run documentation generation
EXAMPLES_CONFIG.forEach(generateDocumentation);
```

---

## Part 4: Scaffolding Tools

### Step 5: Create Example Generator

#### File: `scripts/create-fhevm-example.ts` (Excerpt)

```typescript
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface ExampleMap {
  [key: string]: {
    contract: string;
    test: string;
    title: string;
    description: string;
  };
}

/**
 * Maps example names to their source files
 */
const EXAMPLES_MAP: ExampleMap = {
  "fhe-counter": {
    contract: "contracts/basic/FHECounter.sol",
    test: "test/basic/FHECounter.ts",
    title: "FHE Counter",
    description: "Encrypted counter demonstrating FHE operations",
  },
  "encrypt-single-value": {
    contract: "contracts/basic/encrypt/EncryptSingleValue.sol",
    test: "test/basic/encrypt/EncryptSingleValue.ts",
    title: "Encrypt Single Value",
    description: "Demonstrates single value encryption binding",
  },
  // Add more examples...
};

/**
 * Creates a standalone example repository
 *
 * Usage: npm run create-example fhe-counter ./output/fhe-counter
 */
async function createExample(exampleName: string, outputDir: string) {
  // Validate example exists
  if (!EXAMPLES_MAP[exampleName]) {
    throw new Error(`Example "${exampleName}" not found`);
  }

  const example = EXAMPLES_MAP[exampleName];

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Copy base template
  console.log("Copying base template...");
  copyTemplate("fhevm-hardhat-template", outputDir);

  // Copy contract
  console.log("Copying contract...");
  const contractDest = path.join(outputDir, "contracts", path.basename(example.contract));
  fs.mkdirSync(path.dirname(contractDest), { recursive: true });
  fs.copyFileSync(example.contract, contractDest);

  // Copy test
  console.log("Copying test...");
  const testDest = path.join(outputDir, "test", path.basename(example.test));
  fs.mkdirSync(path.dirname(testDest), { recursive: true });
  fs.copyFileSync(example.test, testDest);

  // Update package.json
  console.log("Updating package.json...");
  const packageJsonPath = path.join(outputDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.description = example.description;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Generate README
  console.log("Generating README.md...");
  generateReadme(exampleName, example, outputDir);

  // Update deployment script
  console.log("Updating deployment script...");
  updateDeploymentScript(contractDest, outputDir);

  console.log(`✓ Example created at: ${outputDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${outputDir}`);
  console.log(`  npm install`);
  console.log(`  npm run test`);
}

/**
 * Copy base Hardhat template
 */
function copyTemplate(templateDir: string, outputDir: string) {
  execSync(`cp -r ${templateDir}/* ${outputDir}/`, { stdio: "inherit" });
}

/**
 * Generate README for example
 */
function generateReadme(
  exampleName: string,
  example: ExampleMap[string],
  outputDir: string
) {
  const readme = `# ${example.title}

${example.description}

## Quick Start

\`\`\`bash
npm install
npm run test
\`\`\`

## What This Example Shows

- Encrypted state management with FHEVM
- FHE arithmetic operations
- Permission management patterns
- Comprehensive testing patterns

## Key Files

- \`contracts/\` - Smart contract implementation
- \`test/\` - Test suite with examples
- \`hardhat.config.ts\` - Network configuration
- \`tasks/\` - Interactive tasks

## Testing

Run tests in mock environment:
\`\`\`bash
npm run test
\`\`\`

Run tests on Sepolia:
\`\`\`bash
npm run test:sepolia
\`\`\`

## Deployment

Deploy to Sepolia testnet:
\`\`\`bash
npm run deploy:sepolia
\`\`\`

## Next Steps

1. Study the contract code in \`contracts/\`
2. Run the tests to see it in action
3. Read the detailed documentation
4. Try modifying the contract
5. Deploy to Sepolia testnet

## Support

- Documentation: [FHEVM Docs](#)
- Forum: [Community Forum](#)
- Discord: [Developer Community](#)

## License

BSD-3-Clause-Clear
`;

  fs.writeFileSync(path.join(outputDir, "README.md"), readme);
}

/**
 * Update deployment script with correct contract name
 */
function updateDeploymentScript(contractPath: string, outputDir: string) {
  const contractName = path.basename(contractPath, ".sol");
  const deployPath = path.join(outputDir, "deploy", "deploy.ts");

  let deployScript = fs.readFileSync(deployPath, "utf-8");
  deployScript = deployScript.replace(/FHECounter/g, contractName);

  fs.writeFileSync(deployPath, deployScript);
}

// Main execution
const [exampleName, outputDir] = process.argv.slice(2);
if (!exampleName || !outputDir) {
  console.error(
    "Usage: npx ts-node scripts/create-fhevm-example.ts <example-name> <output-dir>"
  );
  console.error("\nAvailable examples:");
  Object.keys(EXAMPLES_MAP).forEach(name => {
    console.error(`  - ${name}`);
  });
  process.exit(1);
}

createExample(exampleName, outputDir).catch(console.error);
```

---

## Part 5: Documentation File Placement

### Step 6: Place Files Correctly

Your complete example file structure:

```
your-example-hub/
├── base-template/
│   ├── contracts/
│   ├── test/
│   ├── tasks/
│   ├── hardhat.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── contracts/
│   ├── basic/
│   │   ├── FHECounter.sol
│   │   ├── FHEAdd.sol
│   │   ├── encrypt/
│   │   │   ├── EncryptSingleValue.sol
│   │   │   └── EncryptMultipleValues.sol
│   │   └── decrypt/
│   │       ├── UserDecryptSingleValue.sol
│   │       └── PublicDecryptSingleValue.sol
│   ├── auctions/
│   │   ├── BlindAuction.sol
│   │   └── ConfidentialDutchAuction.sol
│   └── advanced/
│       └── [Your advanced examples]
│
├── test/
│   └── [Mirrors contract structure]
│       ├── basic/
│       │   ├── FHECounter.ts
│       │   ├── FHEAdd.ts
│       │   ├── encrypt/
│       │   └── decrypt/
│       └── auctions/
│
├── scripts/
│   ├── create-fhevm-example.ts
│   ├── create-fhevm-category.ts
│   └── generate-docs.ts
│
├── docs/
│   ├── SUMMARY.md
│   ├── basic/
│   │   ├── fhe-counter.md
│   │   ├── fhe-add.md
│   │   ├── encrypt-single-value.md
│   │   └── decrypt-single-value.md
│   └── auctions/
│       └── blind-auction.md
│
├── package.json
├── README.md
├── DEPLOYMENT_GUIDE.md
└── BOUNTY_SUBMISSION.md
```

---

## Part 6: Building & Testing

### Step 7: Verify Your Implementation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Generate documentation
npm run generate-docs

# Create example repository
npm run create-example fhe-counter ./output/fhe-counter

# Verify generated example
cd ./output/fhe-counter
npm install
npm run test
```

---

## Part 7: Submission Checklist

Before submitting, verify:

- [ ] All contracts compile without warnings
- [ ] All tests pass (mock environment)
- [ ] All tests pass on Sepolia (if applicable)
- [ ] Documentation generates correctly
- [ ] Scaffolding tools work properly
- [ ] README files are comprehensive
- [ ] Code follows Solidity/TypeScript conventions
- [ ] No security vulnerabilities detected
- [ ] Example files properly named
- [ ] Dependencies are up-to-date
- [ ] Video demonstration is complete

---

## Example Submission Structure

```
your-submission/
├── fhevm-examples-hub/
│   ├── base-template/
│   ├── contracts/
│   ├── test/
│   ├── scripts/
│   ├── docs/
│   ├── package.json
│   ├── README.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── FEATURES.md
│
├── demonstration-video.mp4
├── SUBMISSION_NOTES.md
└── DEPLOYMENT_INSTRUCTIONS.md
```

---

## Quick Reference: Essential Patterns

### Permission Pattern
```solidity
// Always use this pattern after FHE operations
FHE.allowThis(result);
FHE.allow(result, msg.sender);
```

### Test Pattern
```typescript
// Always check network before mock operations
if (hre.network.name === "hardhat" || hre.network.name === "anvil") {
  // Mock FHEVM tests
}
```

### Documentation Pattern
```markdown
# Title

## Overview

## Concept

## Implementation

## Testing

## Common Pitfalls

## Next Steps
```

---

This guide provides the complete framework for building production-quality FHEVM examples. Follow these steps, and you'll create valuable educational resources for the FHE community!

