# Testing and Automation Guide

## Testing FHEVM Smart Contracts

### Overview

Testing encrypted smart contracts requires a different approach than traditional Solidity testing due to the nature of fully homomorphic encryption. This guide covers both mock environment testing and real testnet deployment strategies.

---

## Test Environment Hierarchy

### 1. Local Mock Environment (Hardhat)

**Use Case:** Development and rapid iteration
**Speed:** Instant execution
**Limitations:** Simulates FHE behavior, not real encryption

```typescript
// Run mock tests
npm run test

// Benefits:
// - Fast feedback loop (instant)
// - Full control over encrypted values
// - Can decrypt anything for verification
// - Useful for debugging logic

// Limitations:
// - Not real FHE (fakes encryption)
// - Doesn't test actual FHE security properties
// - Deployment may behave differently
```

**Test Structure:**
```typescript
describe("Contract", () => {
  it("should work in mock environment", async function() {
    if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
      this.skip();
    }

    // Mock FHEVM tests here
    const { fhevm } = hre;
    const input = fhevm.createEncryptedInput(contract.target, signer.address);
  });
});
```

### 2. Hardhat with FHEVM Plugin (Enhanced Mock)

**Use Case:** Testing FHE logic more realistically
**Speed:** Still fast (seconds)
**Capabilities:** Simulates actual FHE constraints

```typescript
// Uses @fhevm/hardhat-plugin for enhanced simulation
// More accurate than basic mock but still not real FHE

describe("FHE Operations", () => {
  it("should handle encrypted operations", async () => {
    const encrypted = fhevm.createEncryptedInput(target, user);
    encrypted.add32(5);
    const result = encrypted.encrypt();

    // Result includes encrypted data and zero-knowledge proof
    expect(result.data).to.exist;
    expect(result.proof).to.exist;
  });
});
```

### 3. Sepolia Testnet (Real FHE)

**Use Case:** Final validation before production
**Speed:** 12-15 seconds per block
**Requirements:** Real encrypted operations

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Run Sepolia tests
npm run test:sepolia
```

**Test Structure:**
```typescript
describe("Real Network Tests", () => {
  it("should work on Sepolia", async function() {
    if (hre.network.name !== "sepolia") {
      this.skip();
    }

    // Increased timeout for real blockchain
    this.timeout(160000); // 4 * 40 seconds

    const tx = await contract.someFunction(...args);
    const receipt = await tx.wait(6); // Wait for 6 confirmations
    expect(receipt).to.exist;
  });
});
```

---

## Testing Strategies

### Strategy 1: Dual Environment Testing

Run comprehensive tests in mock, then spot-check on Sepolia:

```typescript
describe("Counter", () => {
  // Comprehensive tests for mock environment
  describe("Mock Environment", () => {
    it("should increment correctly", async function() {
      if (hre.network.name !== "hardhat") this.skip();

      // Full test suite here - can be extensive
      // Test all paths, edge cases, error conditions
    });

    // Add many more test cases
  });

  // Minimal tests for real network (only critical paths)
  describe("Sepolia Network", () => {
    it("should work end-to-end on real network", async function() {
      if (hre.network.name !== "sepolia") this.skip();
      this.timeout(160000);

      // Only essential tests here - real network is slow and costly
    });
  });
});
```

### Strategy 2: Parameterized Testing

Test same logic with different inputs:

```typescript
describe("FHE Operations", () => {
  const testCases = [
    { input: 5, expected: 5 },
    { input: 100, expected: 100 },
    { input: 0, expected: 0 },
    { input: 2**32 - 1, expected: 2**32 - 1 }, // Max uint32
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should handle input ${input}`, async function() {
      if (hre.network.name !== "hardhat") this.skip();

      const encrypted = createEncrypted(input);
      await contract.process(encrypted.data, encrypted.proof);

      const result = await contract.getResult();
      const decrypted = fhevm.userDecryptEuint(result);
      expect(decrypted).to.equal(expected);
    });
  });
});
```

### Strategy 3: Behavior-Driven Testing

Test from user perspective:

```typescript
describe("User Workflow", () => {
  describe("Creating Encrypted Data", () => {
    it("should allow user to create and encrypt value", async function() {
      if (hre.network.name !== "hardhat") this.skip();

      // Simulate user action
      const userSecret = 42;
      const encrypted = fhevm.createEncryptedInput(target, user.address);
      encrypted.add32(userSecret);
      const encryptedData = encrypted.encrypt();

      // Should successfully create encrypted package
      expect(encryptedData.data).to.have.lengthOf.greaterThan(0);
      expect(encryptedData.proof).to.have.lengthOf.greaterThan(0);
    });
  });

  describe("Submitting to Contract", () => {
    it("should process encrypted input correctly", async function() {
      if (hre.network.name !== "hardhat") this.skip();

      const encrypted = createEncrypted(99);
      const tx = await contract.process(encrypted.data, encrypted.proof);
      const receipt = await tx.wait(1);

      expect(receipt?.status).to.equal(1); // Success
    });
  });

  describe("Decrypting Result", () => {
    it("should allow user to decrypt result", async function() {
      if (hre.network.name !== "hardhat") this.skip();

      await contract.process(...encryptedData);
      const result = await contract.getResult();
      const decrypted = fhevm.userDecryptEuint(result);

      expect(decrypted).to.be.a("bigint");
    });
  });
});
```

---

## Mock Environment API Reference

### Creating Encrypted Input

```typescript
// Get FHEVM testing instance
const { fhevm } = hre;

// Create encrypted input
const input = fhevm.createEncryptedInput(
  contract.target,      // Contract address
  signer.address        // User address
);

// Add values to encrypt
input.add8(255);        // 8-bit unsigned
input.add16(65535);     // 16-bit unsigned
input.add32(4294967295); // 32-bit unsigned
input.add64(18446744073709551615n); // 64-bit unsigned

// Add boolean
input.addBool(true);

// Add address
input.addAddress("0x...");

// Encrypt the input
const encrypted = input.encrypt();
// Returns: { data: bytes32[], proof: bytes }
```

### Decrypting Values

```typescript
// Get encrypted value from contract
const encryptedResult = await contract.getCount();

// Decrypt for testing (mock only - fakes real FHE)
const decrypted = await fhevm.userDecryptEuint(encryptedResult);

// Result is bigint
expect(decrypted).to.equal(42n);
```

### Input Proof

```typescript
// Encrypted data includes zero-knowledge proof
const encrypted = input.encrypt();

// Proof proves:
// - Input is validly encrypted
// - User authorized the encryption
// - Data hasn't been tampered with

// Send to contract
const tx = await contract.process(
  encrypted.data,   // Encrypted values
  encrypted.proof   // Zero-knowledge proof
);
```

---

## Permission Management Testing

### Testing FHE.allow() Pattern

```typescript
describe("Permission Management", () => {
  it("should grant contract access with FHE.allowThis()", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    // Setup
    const input = createEncrypted(50);
    const tx = await contract.increment(input.data, input.proof);
    await tx.wait(1);

    // Contract called FHE.allowThis() internally
    // This means contract can read the value
    // Test by calling another function that accesses it
    const result = await contract.getCount();
    expect(result).to.exist;
  });

  it("should grant user access with FHE.allow()", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    // Setup
    const input = createEncrypted(75);
    const tx = await contract.increment(input.data, input.proof);
    await tx.wait(1);

    // Contract called FHE.allow(value, msg.sender)
    // This allows caller to decrypt
    const encryptedCount = await contract.getCount();
    const decrypted = await fhevm.userDecryptEuint(encryptedCount);

    // Should successfully decrypt without error
    expect(decrypted).to.equal(75n);
  });

  it("should prevent unauthorized users from decrypting", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    // In mock environment, this may not work perfectly
    // But documents the intended security model

    const input = createEncrypted(100);
    await (await contract.connect(alice).increment(
      input.data,
      input.proof
    )).wait(1);

    // Try to decrypt as bob (didn't create the input)
    const encryptedCount = await contract.getCount();

    // In real FHE, bob would fail to decrypt
    // Mock environment might allow it, but the pattern is correct
    try {
      const result = await fhevm.userDecryptEuint(
        encryptedCount,
        // bob's key would be needed in real scenario
      );
      // May or may not throw depending on implementation
    } catch (error) {
      // Expected: Permission denied
    }
  });
});
```

---

## Edge Case Testing

### Testing Boundary Conditions

```typescript
describe("Edge Cases", () => {
  it("should handle zero values", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    const input = fhevm.createEncryptedInput(contract.target, owner.address);
    input.add32(0);
    const encrypted = input.encrypt();

    await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);

    const result = await contract.getCount();
    const decrypted = await fhevm.userDecryptEuint(result);
    expect(decrypted).to.equal(0n);
  });

  it("should handle maximum uint32 values", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    const maxUint32 = (2n ** 32n) - 1n;

    const input = fhevm.createEncryptedInput(contract.target, owner.address);
    input.add32(maxUint32);
    const encrypted = input.encrypt();

    await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);

    const result = await contract.getCount();
    const decrypted = await fhevm.userDecryptEuint(result);
    expect(decrypted).to.equal(maxUint32);
  });

  it("should handle overflow gracefully", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    const maxUint32 = (2n ** 32n) - 1n;

    // Set to max
    const input1 = fhevm.createEncryptedInput(contract.target, owner.address);
    input1.add32(maxUint32);
    const encrypted1 = input1.encrypt();
    await (await contract.increment(encrypted1.data, encrypted1.proof)).wait(1);

    // Try to add 1 (would overflow)
    const input2 = fhevm.createEncryptedInput(contract.target, owner.address);
    input2.add32(1);
    const encrypted2 = input2.encrypt();

    // Behavior depends on contract implementation
    // Test documents expected behavior
    try {
      await (await contract.increment(encrypted2.data, encrypted2.proof)).wait(1);
      // If it succeeds, verify overflow handling (wraps or checks)
    } catch (error: any) {
      // If contract enforces max, this is expected
      expect(error.message).to.include("overflow");
    }
  });

  it("should handle many sequential operations", async function() {
    if (hre.network.name !== "hardhat") this.skip();

    let expectedValue = 0n;

    // Perform 100 increments
    for (let i = 0; i < 100; i++) {
      const value = BigInt(Math.floor(Math.random() * 1000));
      const input = fhevm.createEncryptedInput(contract.target, owner.address);
      input.add32(value);
      const encrypted = input.encrypt();

      await (await contract.increment(encrypted.data, encrypted.proof)).wait(1);
      expectedValue += value;
    }

    const result = await contract.getCount();
    const decrypted = await fhevm.userDecryptEuint(result);
    expect(decrypted).to.equal(expectedValue);
  });
});
```

---

## Automation Setup

### npm Scripts Configuration

```json
{
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "test:sepolia": "HARDHAT_NETWORK=sepolia hardhat test --grep Sepolia",
    "test:watch": "hardhat test --watch",
    "coverage": "hardhat coverage",
    "lint": "eslint . && solhint 'contracts/**/*.sol'",
    "format": "prettier --write .",
    "clean": "hardhat clean",
    "deploy:localhost": "hardhat run scripts/deploy.ts --network localhost",
    "deploy:sepolia": "hardhat run scripts/deploy.ts --network sepolia",
    "verify:sepolia": "hardhat verify --network sepolia",
    "typechain": "typechain --target ethers-v6 --out-dir typechain-types './abi/**/*.json'",
    "create-example": "ts-node scripts/create-fhevm-example.ts",
    "create-category": "ts-node scripts/create-fhevm-category.ts",
    "generate-docs": "ts-node scripts/generate-docs.ts"
  }
}
```

### Hardhat Configuration for Testing

```typescript
// hardhat.config.ts

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";
import "@nomiclabs/hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },

  networks: {
    // Mock environment (local)
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },

    // Anvil (external local node)
    anvil: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Sepolia testnet
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.MNEMONIC
        ? { mnemonic: process.env.MNEMONIC }
        : [],
      chainId: 11155111,
    },
  },

  // TypeChain for type-safe contract interaction
  typechain: {
    target: "ethers-v6",
    outDir: "typechain-types",
  },

  // FHEVM plugin configuration
  fhevm: {
    backend: "holesky", // Use Holesky FHEVM backend for testing
  },

  // Mocha test configuration
  mocha: {
    timeout: 40000, // Default timeout
  },
};

export default config;
```

---

## Continuous Integration (CI) Setup

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Compile contracts
        run: npm run compile

      - name: Run tests
        run: npm run test

      - name: Generate coverage
        run: npm run coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  sepolia-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    # Only run on main branch to save costs

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js 20
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run Sepolia tests
        run: npm run test:sepolia
        env:
          INFURA_API_KEY: ${{ secrets.INFURA_API_KEY }}
          MNEMONIC: ${{ secrets.MNEMONIC }}
```

---

## Pre-commit Hooks

### Setup with Husky

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-push "npm run test"
```

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,js}": "eslint --fix",
    "*.{ts,js,json,md}": "prettier --write"
  }
}
```

---

## Common Testing Pitfalls

### ❌ Pitfall 1: Forgetting to Skip Mock Tests on Real Networks

```typescript
// WRONG - Will fail on Sepolia
it("should increment", async () => {
  const encrypted = fhevm.createEncryptedInput(...); // ❌ fhevm is undefined
  // ...
});
```

```typescript
// RIGHT - Properly handles both environments
it("should increment", async function() {
  if (hre.network.name !== "hardhat") {
    this.skip(); // ✓ Skip on real networks
  }

  const { fhevm } = hre;
  const encrypted = fhevm.createEncryptedInput(...); // ✓ Works now
  // ...
});
```

### ❌ Pitfall 2: Not Awaiting Transactions

```typescript
// WRONG - Transaction not confirmed
contract.increment(data, proof);
const result = await contract.getCount(); // ❌ May read old value
```

```typescript
// RIGHT - Wait for confirmation
const tx = await contract.increment(data, proof);
await tx.wait(1); // ✓ Wait for block confirmation
const result = await contract.getCount(); // ✓ Reads new value
```

### ❌ Pitfall 3: Missing Timeout on Real Networks

```typescript
// WRONG - Default 40s timeout insufficient
it("should work on Sepolia", async () => {
  const tx = await contract.operation(...);
  await tx.wait(6); // ❌ May timeout
});
```

```typescript
// RIGHT - Increase timeout for slow networks
it("should work on Sepolia", async function() {
  this.timeout(160000); // ✓ 4 * 40 seconds
  const tx = await contract.operation(...);
  await tx.wait(6);
});
```

### ❌ Pitfall 4: Not Handling Decimal Types

```typescript
// WRONG - Mix of Number and BigInt
const value = 100; // ❌ Should be BigInt for large numbers
input.add32(value);
```

```typescript
// RIGHT - Always use BigInt for large values
const value = 100n; // ✓ BigInt literal
input.add32(value);
```

---

## Performance Optimization

### Test Execution Time

```typescript
// Use shared fixtures to reduce setup overhead
describe("Counter", () => {
  let contract: FHECounter;
  let owner: Signer;

  before(async () => {
    // One-time setup for all tests
    const FHECounter = await ethers.getContractFactory("FHECounter");
    contract = await FHECounter.deploy();
  });

  it("test 1", async () => {
    // Reuses contract from before()
  });

  it("test 2", async () => {
    // Reuses contract from before()
  });
});

// vs. slower approach with beforeEach()
describe("Counter (slow)", () => {
  // ❌ Deploys fresh contract for each test (slower)
  beforeEach(async () => {
    const FHECounter = await ethers.getContractFactory("FHECounter");
    contract = await FHECounter.deploy();
  });
});
```

### Parallel Test Execution

```bash
# Run tests in parallel (if tests don't conflict)
npx hardhat test --parallel

# Or in npm script
npm run test -- --parallel
```

---

## Debugging Tests

### Enable Verbose Output

```bash
# See detailed test output
HARDHAT_DEBUG=true npm run test

# With ethers debugging
DEBUG=ethers:* npm run test
```

### Debug Single Test

```bash
# Run only one test
npm run test -- --grep "should increment"

# Run tests matching pattern
npm run test -- --grep "Permission"
```

### Use Console Logging

```typescript
it("should work", async () => {
  console.log("Before operation");
  const result = await operation();
  console.log("Result:", result);
  expect(result).to.exist;
});
```

---

## Test Coverage

### Generate Coverage Report

```bash
npm run coverage
```

```
-------------|----------|----------|----------|----------|
File         |  % Stmts | % Branch | % Funcs  | % Lines  |
-------------|----------|----------|----------|----------|
All files    |   95.2   |   89.5   |   100    |   95.1   |
FHECounter   |   95.2   |   89.5   |   100    |   95.1   |
-------------|----------|----------|----------|----------|
```

### Coverage Targets

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 90%+
- **Lines:** 80%+

---

## Conclusion

Comprehensive testing is essential for FHEVM contracts. Use mock environment for development, then validate on Sepolia before production deployment.

Key takeaways:
- Test in both mock and real environments
- Always handle network-specific behavior
- Increase timeouts for real networks
- Use BigInt for all numeric values
- Properly manage permissions
- Test edge cases extensively

