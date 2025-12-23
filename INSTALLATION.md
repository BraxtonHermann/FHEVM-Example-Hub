# Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For version control
- **MetaMask** (optional): For Sepolia testnet deployment

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fhevm-examples-hub
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Hardhat
- @fhevm/solidity
- @fhevm/hardhat-plugin
- TypeScript
- Testing frameworks
- Development tools

### 3. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```env
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
INFURA_API_KEY=your_infura_api_key_here

# Private Keys (NEVER commit real keys!)
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
MNEMONIC=test test test test test test test test test test test junk

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Gas Reporter
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
```

### 4. Verify Installation

Compile the contracts to ensure everything is set up correctly:

```bash
npm run compile
```

You should see output indicating successful compilation of all contracts.

### 5. Run Tests

```bash
npm run test
```

This runs the test suite in the mock environment.

## Detailed Setup

### For Local Development

1. **Compile Contracts**

```bash
npm run compile
```

2. **Run Tests**

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- test/basic/FHECounter.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run coverage
```

3. **Lint and Format Code**

```bash
# Check code quality
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### For Sepolia Testnet Deployment

1. **Get Sepolia ETH**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Request test ETH for your wallet address

2. **Configure Network**
   - Add your Infura API key or RPC URL to `.env`
   - Add your private key or mnemonic (use a test wallet only!)

3. **Deploy Contracts**

```bash
npm run deploy:sepolia
```

4. **Verify on Etherscan**

```bash
npm run verify:sepolia
```

5. **Run Tests on Sepolia**

```bash
npm run test:sepolia
```

## Using the Automation Tools

### Generate a Standalone Example

```bash
npm run create-example fhe-counter ./output/my-example
```

Available examples:
- `fhe-counter` - FHE Counter
- `fhe-add` - FHE Addition
- `fhe-equal` - FHE Equality
- `encrypt-single-value` - Encrypt Single Value
- `encrypt-multiple-values` - Encrypt Multiple Values
- `user-decrypt-single` - User Decrypt Single
- `user-decrypt-multiple` - User Decrypt Multiple
- `public-decrypt-single` - Public Decrypt Single
- `public-decrypt-multiple` - Public Decrypt Multiple
- `access-control` - Access Control
- `blind-auction` - Blind Auction
- `erc7984-basic` - ERC7984 Token

### Generate a Category Project

```bash
npm run create-category basic ./output/basic-examples
```

Available categories:
- `basic` - Basic examples
- `encryption` - Encryption examples
- `decryption` - Decryption examples
- `access-control` - Access control examples
- `auctions` - Auction examples
- `tokens` - Token examples

### Generate Documentation

```bash
npm run generate-docs
```

## Troubleshooting

### Common Issues

**1. Node Version Error**

```
Error: Node version must be >= 20.0.0
```

Solution: Upgrade Node.js to version 20 or higher:
```bash
nvm install 20
nvm use 20
```

**2. Compilation Errors**

```
Error: Cannot find module '@fhevm/solidity'
```

Solution: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

**3. Test Failures on Sepolia**

```
Error: Insufficient funds
```

Solution: Ensure your test wallet has enough Sepolia ETH from a faucet.

**4. Type Generation Issues**

```
Error: TypeChain types not found
```

Solution: Regenerate types:
```bash
npm run typechain
```

### Getting Help

If you encounter issues:

1. Check the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. Review the [TESTING_AND_AUTOMATION_GUIDE.md](./TESTING_AND_AUTOMATION_GUIDE.md)
3. Visit [FHEVM Documentation](https://docs.zama.ai/fhevm)
4. Join [Zama Discord](https://discord.gg/zama)
5. Ask on [Zama Community Forum](https://community.zama.ai)

## Next Steps

After successful installation:

1. **Explore Examples**: Browse the `contracts/` directory
2. **Run Tests**: Understand how examples work through tests
3. **Generate Projects**: Use automation tools to create standalone projects
4. **Read Documentation**: Study the comprehensive guides
5. **Build Your Own**: Start developing your FHEVM applications

## System Requirements

### Minimum Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 4 GB
- **Disk Space**: 1 GB free space
- **Internet**: Stable connection for dependencies

### Recommended Requirements

- **OS**: Latest Windows 11, macOS 12+, or Linux
- **RAM**: 8 GB or more
- **Disk Space**: 2 GB free space
- **Internet**: High-speed connection

## IDE Setup

### Visual Studio Code (Recommended)

Install recommended extensions:

1. **Solidity** by Juan Blanco
2. **ESLint** by Microsoft
3. **Prettier** by Prettier
4. **Hardhat Solidity** by Nomic Foundation

### WebStorm / IntelliJ

1. Install Solidity plugin
2. Enable TypeScript support
3. Configure ESLint and Prettier

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all Solidity contracts |
| `npm run test` | Run all tests |
| `npm run test:sepolia` | Run tests on Sepolia |
| `npm run test:watch` | Run tests in watch mode |
| `npm run coverage` | Generate test coverage report |
| `npm run lint` | Run all linters |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Clean build artifacts |
| `npm run typechain` | Generate TypeChain types |
| `npm run deploy:localhost` | Deploy to localhost |
| `npm run deploy:sepolia` | Deploy to Sepolia |
| `npm run verify:sepolia` | Verify on Etherscan |
| `npm run create-example` | Generate standalone example |
| `npm run create-category` | Generate category project |
| `npm run generate-docs` | Generate documentation |

## Additional Resources

- [README.md](./README.md) - Project overview
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Development workflow
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [ANTI_PATTERNS.md](./ANTI_PATTERNS.md) - Common mistakes to avoid

---

**Ready to build privacy-preserving smart contracts!** 🚀
