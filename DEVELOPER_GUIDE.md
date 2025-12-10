# Developer Guide

Welcome to the FHEVM Example Hub! This guide will help you understand the project structure, add new examples, and contribute effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Adding New Examples](#adding-new-examples)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation](#documentation)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm 7+
- Git
- Code editor (VS Code recommended)
- MetaMask wallet for testnet deployment

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PrivacyGaming

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

## Project Structure

```
PrivacyGaming/
├── contracts/              # Source contracts
│   ├── basic/              # Basic FHE operations
│   ├── encrypt/            # Encryption examples
│   ├── decrypt/            # Decryption examples
│   ├── access-control/     # Permission management
│   ├── auctions/           # Auction mechanisms
│   └── tokens/             # Token implementations
│
├── test/                   # Test files (mirrors contracts/)
│   ├── basic/
│   ├── encrypt/
│   ├── decrypt/
│   ├── access-control/
│   ├── auctions/
│   └── tokens/
│
├── scripts/                # Automation tools
│   ├── create-fhevm-example.ts
│   ├── generate-docs.ts
│   └── deploy.ts
│
├── docs/                   # Generated documentation
│   ├── SUMMARY.md
│   ├── basic/
│   ├── encrypt/
│   └── [other categories]
│
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project overview
```

---

## Development Workflow

### 1. Create a New Example

```bash
# Step 1: Create contract file
touch contracts/category/YourExample.sol

# Step 2: Create test file
touch test/category/YourExample.test.ts

# Step 3: Implement contract and tests

# Step 4: Add to EXAMPLES_MAP in scripts/create-fhevm-example.ts

# Step 5: Add to EXAMPLES_CONFIG in scripts/generate-docs.ts

# Step 6: Test your example
npm run test -- test/category/YourExample.test.ts

# Step 7: Generate standalone repository
npm run create-example your-example ./output/your-example

# Step 8: Generate documentation
npm run generate-docs your-example
```

### 2. Update Existing Examples

```bash
# Edit contract
vim contracts/basic/FHECounter.sol

# Update tests
vim test/basic/FHECounter.test.ts

# Run tests
npm run test

# Regenerate documentation
npm run generate-docs fhe-counter
```

### 3. Code Review Process

1. Create feature branch: `git checkout -b feature/new-example`
2. Implement changes
3. Run linter: `npm run lint`
4. Run tests: `npm run test`
5. Generate documentation: `npm run generate-docs`
6. Commit with descriptive message
7. Push and create pull request

---

## Adding New Examples

### Contract Template

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Your Example Title
/// @notice Brief description
/// @dev Detailed technical description
contract YourExample is ZamaEthereumConfig {
  euint32 private _state;

  event SomethingHappened(address indexed user);

  /// @notice Function description
  /// @param input Encrypted input value
  /// @param proof Zero-knowledge proof
  function yourFunction(externalEuint32 input, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(input, proof);

    // Your FHE operations here
    _state = FHE.add(_state, encrypted);

    // Always grant permissions
    FHE.allowThis(_state);
    FHE.allow(_state, msg.sender);

    emit SomethingHappened(msg.sender);
  }

  function getState() external view returns (euint32) {
    return _state;
  }
}
```

### Test Template

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { YourExample } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YourExample", function () {
  let contract: YourExample;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const YourExample = await ethers.getContractFactory("YourExample");
    contract = await YourExample.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Your Feature", function () {
    it("should perform operation correctly", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(
        await contract.getAddress(),
        owner.address
      );
      input.add32(42);
      const encrypted = input.encrypt();

      await contract.yourFunction(encrypted.data, encrypted.proof);

      const result = await contract.getState();
      const decrypted = await fhevm.userDecryptEuint32(result);
      expect(decrypted).to.equal(42n);
    });
  });
});
```

### Registering the Example

1. **Add to EXAMPLES_MAP** in `scripts/create-fhevm-example.ts`:

```typescript
"your-example": {
  contract: "contracts/category/YourExample.sol",
  test: "test/category/YourExample.test.ts",
  title: "Your Example Title",
  description: "Brief description of your example",
  difficulty: "beginner", // or "intermediate", "advanced"
  category: "category-name",
},
```

2. **Add to EXAMPLES_CONFIG** in `scripts/generate-docs.ts`:

```typescript
{
  name: "your-example",
  title: "Your Example Title",
  contractPath: "contracts/category/YourExample.sol",
  testPath: "test/category/YourExample.test.ts",
  outputPath: "docs/category/your-example.md",
  category: "Category Name",
  order: 1,
  difficulty: "beginner",
},
```

---

## Testing Guidelines

### Writing Tests

1. **Always include network checks:**
```typescript
if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
  this.skip();
}
```

2. **Use proper async/await:**
```typescript
const tx = await contract.function(...args);
await tx.wait();
```

3. **Test categories to include:**
   - Deployment tests
   - Happy path tests
   - Edge case tests
   - Permission tests
   - Error handling tests

4. **Use descriptive test names:**
```typescript
it("should increment counter by encrypted value", async function () {
  // Test implementation
});
```

### Running Tests

```bash
# All tests
npm run test

# Specific file
npm run test -- test/basic/FHECounter.test.ts

# With coverage
npm run coverage

# Watch mode
npm run test:watch

# Sepolia testnet
npm run test:sepolia
```

---

## Documentation

### JSDoc Guidelines

Use comprehensive JSDoc comments:

```solidity
/// @title Contract Title
/// @notice User-facing description
/// @dev Developer-focused technical details
contract Example {
  /// @notice What this function does
  /// @dev How it works internally
  /// @param param1 Description of parameter
  /// @return Description of return value
  function example(uint256 param1) external returns (uint256) {
    // Implementation
  }
}
```

### Generating Documentation

```bash
# Generate docs for specific example
npm run generate-docs your-example

# Generate docs for all examples
npm run generate-all-docs
```

### Documentation Structure

Generated docs include:
- Overview and concepts
- Contract code with syntax highlighting
- Test code examples
- Key concepts explanation
- Common pitfalls
- Resources and links

---

## Deployment

### Local Deployment

```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network (in another terminal)
npm run deploy:localhost
```

### Sepolia Testnet Deployment

```bash
# Ensure .env is configured with:
# - PRIVATE_KEY
# - INFURA_API_KEY
# - ETHERSCAN_API_KEY

# Deploy
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia <CONTRACT_ADDRESS>
```

### Deployment Script Template

```typescript
import { ethers } from "hardhat";

async function main() {
  const ContractName = await ethers.getContractFactory("ContractName");

  console.log("Deploying ContractName...");

  const contract = await ContractName.deploy(/* constructor args */);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ContractName deployed to: ${address}`);

  // Wait for block confirmations
  await contract.deploymentTransaction()?.wait(6);

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@fhevm/solidity'"

**Solution:**
```bash
npm install
npm run compile
```

#### 2. "fhevm is undefined" in tests

**Solution:** Add network check:
```typescript
if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
  this.skip();
}
const { fhevm } = hre as any;
```

#### 3. Tests failing with "Invalid proof"

**Solution:** Ensure you're creating encrypted input correctly:
```typescript
const input = fhevm.createEncryptedInput(
  await contract.getAddress(), // Contract address
  signer.address                // User address
);
input.add32(value);
const encrypted = input.encrypt();
```

#### 4. "Transaction reverted" without message

**Solution:** Check permission management:
```solidity
FHE.allowThis(value);
FHE.allow(value, msg.sender);
```

#### 5. Type errors with BigInt

**Solution:** Use BigInt literals:
```typescript
expect(decrypted).to.equal(42n); // Note the 'n'
```

### Debug Mode

Enable verbose logging:

```bash
# Hardhat debug
HARDHAT_DEBUG=true npm run test

# Ethers debug
DEBUG=ethers:* npm run test
```

### Getting Help

- Check [FHEVM Documentation](https://docs.zama.ai/fhevm)
- Read existing examples in contracts/
- Review test files for patterns
- Ask in [Zama Community Forum](https://community.zama.ai)
- Join [Discord Server](https://discord.gg/zama)

---

## Best Practices

### Contract Development

1. ✅ Always use `euint` types for encrypted values
2. ✅ Grant permissions after FHE operations
3. ✅ Validate inputs with proofs
4. ✅ Use events for important state changes
5. ✅ Document with comprehensive JSDoc
6. ❌ Never return raw encrypted values in view functions without permissions
7. ❌ Don't perform operations without proper access control

### Testing

1. ✅ Test in both mock and real networks
2. ✅ Cover edge cases and boundary conditions
3. ✅ Use descriptive test names
4. ✅ Test permission management
5. ❌ Don't skip network checks
6. ❌ Don't forget to wait for transactions

### Documentation

1. ✅ Keep documentation synchronized with code
2. ✅ Explain "why" not just "what"
3. ✅ Include code examples
4. ✅ Document common pitfalls
5. ❌ Don't use outdated examples
6. ❌ Don't skip JSDoc comments

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Write comprehensive tests
5. Update documentation
6. Submit pull request

For major changes, please open an issue first to discuss proposed changes.

---

## License

This project is licensed under the BSD-3-Clause-Clear license.

---

## Support

- **Documentation:** Included guides and FHEVM docs
- **Forum:** [Zama Community](https://community.zama.ai)
- **Discord:** [Developer Community](https://discord.gg/zama)
- **GitHub Issues:** Bug reports and feature requests

---

Happy developing! 🚀
