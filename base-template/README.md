# FHEVM Example Template

A starter template for building FHEVM (Fully Homomorphic Encryption Virtual Machine) smart contract examples.

## Overview

This template provides a complete Hardhat setup configured for developing and testing privacy-preserving smart contracts using Zama's FHEVM protocol.

## Quick Start

### Prerequisites

- Node.js 20.0.0 or higher
- npm 7.0.0 or higher
- Git

### Installation

```bash
npm install
```

### Compilation

```bash
npm run compile
```

### Running Tests

```bash
npm run test
```

### Running Tests on Sepolia Testnet

```bash
npm run test:sepolia
```

## Project Structure

```
.
├── contracts/           # Solidity smart contracts
├── test/               # Test files (TypeScript)
├── deploy/             # Deployment scripts
├── scripts/            # Utility scripts
├── hardhat.config.ts   # Hardhat configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies
└── .env.example        # Environment variables template
```

## Key Files

- **hardhat.config.ts**: Hardhat configuration with FHEVM plugin and network settings
- **package.json**: Dependencies including @fhevm/solidity and @fhevm/hardhat-plugin
- **.env.example**: Template for environment variables (copy to .env for local configuration)

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables in `.env` with your settings:
   - Network RPC URLs
   - Private keys (for testnet deployment)
   - API keys (for Etherscan verification)

## Available Scripts

- `npm run compile` - Compile contracts
- `npm run test` - Run all tests
- `npm run test:sepolia` - Run tests on Sepolia testnet
- `npm run coverage` - Generate test coverage report
- `npm run lint` - Run linters
- `npm run format` - Format code with Prettier
- `npm run deploy:localhost` - Deploy to localhost
- `npm run deploy:sepolia` - Deploy to Sepolia testnet

## Network Configuration

### Hardhat (Local)
- Chain ID: 31337
- Auto-generates 20 accounts with 10,000 ETH each

### Sepolia Testnet
- Chain ID: 11155111
- Requires RPC URL and funded account

## Smart Contract Development

Create your Solidity contracts in the `contracts/` directory. Each contract should:

1. Use Solidity 0.8.24 or compatible version
2. Import from `@fhevm/solidity` for FHE functionality
3. Extend `ZamaEthereumConfig` for proper FHEVM integration

### Example Contract

```solidity
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ExampleContract is ZamaEthereumConfig {
  euint32 private encryptedValue;

  function setEncryptedValue(externalEuint32 _value, bytes calldata _inputProof) external {
    encryptedValue = FHE.fromExternal(_value, _inputProof);
    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);
  }
}
```

## Testing

Tests are written in TypeScript using Mocha and Chai. Place test files in the `test/` directory.

### Example Test

```typescript
import { expect } from "chai";
import hre from "hardhat";

describe("ExampleContract", () => {
  it("should initialize correctly", async () => {
    const contract = await hre.ethers.deployContract("ExampleContract");
    await contract.waitForDeployment();
    expect(contract.target).to.be.properAddress;
  });
});
```

## Deployment

Create deployment scripts in the `deploy/` directory using hardhat-deploy pattern.

## Type Generation

TypeChain types are automatically generated after compilation:

```bash
npm run typechain
```

Generated types are available in the `types/` directory.

## License

BSD-3-Clause-Clear

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Zama Community](https://community.zama.ai)
