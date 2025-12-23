import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * FHEVM Category Generator
 *
 * Creates multi-example projects organized by category
 * Usage: npx ts-node scripts/create-fhevm-category.ts <category> <output-dir>
 */

interface CategoryExample {
  name: string;
  contractPath: string;
  testPath: string;
}

interface CategoryDefinition {
  name: string;
  description: string;
  examples: CategoryExample[];
}

/**
 * Category definitions mapping
 */
const CATEGORIES: Record<string, CategoryDefinition> = {
  basic: {
    name: "Basic FHEVM Examples",
    description:
      "Fundamental FHEVM operations including encryption, decryption, and basic FHE arithmetic operations",
    examples: [
      {
        name: "fhe-counter",
        contractPath: "contracts/basic/FHECounter.sol",
        testPath: "test/basic/FHECounter.test.ts",
      },
      {
        name: "fhe-add",
        contractPath: "contracts/basic/FHEAdd.sol",
        testPath: "test/basic/FHEAdd.test.ts",
      },
    ],
  },
  encryption: {
    name: "Encryption Examples",
    description:
      "Learn how to encrypt single and multiple values using FHEVM",
    examples: [
      {
        name: "encrypt-single-value",
        contractPath: "contracts/encrypt/EncryptSingleValue.sol",
        testPath: "test/encrypt/EncryptSingleValue.test.ts",
      },
    ],
  },
  decryption: {
    name: "Decryption Examples",
    description:
      "Learn user and public decryption patterns for FHEVM values",
    examples: [
      {
        name: "user-decrypt-single",
        contractPath: "contracts/decrypt/UserDecryptSingleValue.sol",
        testPath: "test/decrypt/UserDecryptSingleValue.test.ts",
      },
    ],
  },
  "access-control": {
    name: "Access Control Examples",
    description:
      "Master permission management patterns using FHE.allow() and related functions",
    examples: [
      {
        name: "access-control",
        contractPath: "contracts/access-control/AccessControl.sol",
        testPath: "test/access-control/AccessControl.test.ts",
      },
    ],
  },
  auctions: {
    name: "Auction Examples",
    description:
      "Advanced auction implementations using confidential bids and price mechanisms",
    examples: [
      {
        name: "blind-auction",
        contractPath: "contracts/auctions/BlindAuction.sol",
        testPath: "test/auctions/BlindAuction.test.ts",
      },
    ],
  },
  tokens: {
    name: "Token Examples",
    description:
      "Confidential token implementations including ERC7984 and other token standards",
    examples: [
      {
        name: "erc7984-basic",
        contractPath: "contracts/tokens/ERC7984Basic.sol",
        testPath: "test/tokens/ERC7984Basic.test.ts",
      },
    ],
  },
};

/**
 * Creates a category-based project with multiple examples
 */
async function createCategoryProject(
  category: string,
  outputDir: string
): Promise<void> {
  console.log("\n🚀 FHEVM Category Generator\n");

  // Validate category
  if (!CATEGORIES[category]) {
    console.error(`❌ Error: Category "${category}" not found\n`);
    console.log("Available categories:");
    Object.entries(CATEGORIES).forEach(([key, info]) => {
      console.log(`  ${key.padEnd(20)} - ${info.name}`);
    });
    process.exit(1);
  }

  const categoryInfo = CATEGORIES[category];
  console.log(`📦 Creating category project: ${categoryInfo.name}`);
  console.log(`📂 Output directory: ${outputDir}\n`);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 1: Copy base template
  console.log("1️⃣  Copying base template...");
  copyTemplate(outputDir);

  // Step 2: Create category directory structure
  console.log("2️⃣  Creating category structure...");
  createCategoryStructure(outputDir, category);

  // Step 3: Copy all examples in category
  console.log("3️⃣  Copying examples...");
  const exampleNames: string[] = [];
  categoryInfo.examples.forEach((example) => {
    copyExample(example.contractPath, example.testPath, outputDir);
    exampleNames.push(example.name);
  });

  // Step 4: Update package.json
  console.log("4️⃣  Updating package.json...");
  updateCategoryPackageJson(outputDir, category, categoryInfo);

  // Step 5: Generate comprehensive README
  console.log("5️⃣  Generating README.md...");
  generateCategoryReadme(outputDir, category, categoryInfo, exampleNames);

  // Step 6: Create index documentation
  console.log("6️⃣  Creating documentation index...");
  createDocumentationIndex(outputDir, categoryInfo);

  console.log("\n✅ Category project created successfully!");
  console.log("\nNext steps:");
  console.log(`  cd ${outputDir}`);
  console.log(`  npm install`);
  console.log(`  npm run compile`);
  console.log(`  npm run test\n`);
}

/**
 * Copy base template
 */
function copyTemplate(outputDir: string): void {
  const templateDir = path.join(__dirname, "..", "base-template");

  if (!fs.existsSync(templateDir)) {
    console.warn("⚠️  Warning: Base template not found");
    createMinimalTemplate(outputDir);
    return;
  }

  try {
    // Copy template files
    const files = fs.readdirSync(templateDir);
    files.forEach((file) => {
      const src = path.join(templateDir, file);
      const dest = path.join(outputDir, file);

      if (fs.statSync(src).isDirectory()) {
        if (file !== "node_modules" && file !== ".git") {
          copyDirectory(src, dest);
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    });
  } catch (error) {
    console.warn("⚠️  Warning: Using minimal template structure");
    createMinimalTemplate(outputDir);
  }
}

/**
 * Copy directory recursively
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

/**
 * Create minimal template structure
 */
function createMinimalTemplate(outputDir: string): void {
  const dirs = ["contracts", "test", "scripts", "deploy"];
  dirs.forEach((dir) => {
    const dirPath = path.join(outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Create category-specific directory structure
 */
function createCategoryStructure(outputDir: string, category: string): void {
  const dirs = ["contracts", "test", "docs"];
  dirs.forEach((dir) => {
    const dirPath = path.join(outputDir, dir, category);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Copy example contract and test
 */
function copyExample(
  contractPath: string,
  testPath: string,
  outputDir: string
): void {
  const srcContractPath = path.join(__dirname, "..", contractPath);
  const srcTestPath = path.join(__dirname, "..", testPath);

  if (fs.existsSync(srcContractPath)) {
    const contractName = path.basename(contractPath);
    const destContractPath = path.join(
      outputDir,
      "contracts",
      contractName
    );
    fs.copyFileSync(srcContractPath, destContractPath);
  }

  if (fs.existsSync(srcTestPath)) {
    const testName = path.basename(testPath);
    const destTestPath = path.join(outputDir, "test", testName);
    fs.copyFileSync(srcTestPath, destTestPath);
  }
}

/**
 * Update package.json with category information
 */
function updateCategoryPackageJson(
  outputDir: string,
  category: string,
  categoryInfo: CategoryDefinition
): void {
  const packageJsonPath = path.join(outputDir, "package.json");

  let packageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  }

  const updated = {
    ...packageJson,
    name: `fhevm-examples-${category}`,
    version: "1.0.0",
    description: categoryInfo.description,
    keywords: ["fhevm", "fhe", "privacy", "encryption", category],
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(updated, null, 2));
}

/**
 * Generate comprehensive README
 */
function generateCategoryReadme(
  outputDir: string,
  category: string,
  categoryInfo: CategoryDefinition,
  exampleNames: string[]
): void {
  const readme = `# ${categoryInfo.name}

${categoryInfo.description}

## Overview

This project contains ${exampleNames.length} complete, runnable example${exampleNames.length > 1 ? "s" : ""} demonstrating FHEVM concepts in the ${category} category.

## Examples Included

${exampleNames.map((name, index) => `${index + 1}. **${name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}** - \`contracts/${name}*.sol\``).join("\n")}

## Quick Start

### Prerequisites

- Node.js 20.0.0 or higher
- npm 7.0.0 or higher

### Installation

\`\`\`bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run all tests
npm run test
\`\`\`

## Project Structure

\`\`\`
.
├── contracts/          # Example smart contracts
├── test/              # Test files for examples
├── deploy/            # Deployment scripts
├── docs/              # Documentation
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Project dependencies
└── README.md          # This file
\`\`\`

## Running Specific Examples

Each example can be compiled and tested independently:

\`\`\`bash
# Compile all
npm run compile

# Run all tests
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia

# View code coverage
npm run coverage
\`\`\`

## Code Quality

\`\`\`bash
# Run linters
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
\`\`\`

## Deployment

### Local Network

\`\`\`bash
# Start local Hardhat node
npx hardhat node

# Deploy in another terminal
npm run deploy:localhost
\`\`\`

### Sepolia Testnet

\`\`\`bash
# Set up environment first
cp .env.example .env
# Edit .env with your settings

# Deploy
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
\`\`\`

## Key Concepts

### Encrypted Types

\`\`\`solidity
euint8, euint16, euint32, euint64  // Encrypted unsigned integers
ebool                               // Encrypted boolean
eaddress                            // Encrypted address
\`\`\`

### FHE Operations

\`\`\`solidity
FHE.add(a, b)              // Addition on encrypted values
FHE.sub(a, b)              // Subtraction
FHE.mul(a, b)              // Multiplication
FHE.eq(a, b)               // Equality comparison
FHE.ge(a, b)               // Greater or equal comparison
FHE.select(cond, t, f)     // Conditional selection
\`\`\`

### Permission Management

\`\`\`solidity
FHE.allowThis(value)           // Contract can access
FHE.allow(value, msg.sender)   // User can decrypt
\`\`\`

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Zama Community Forum](https://community.zama.ai)
- [Example Hub](#) - Main example repository

## Useful Commands

| Command | Description |
|---------|-------------|
| \`npm run compile\` | Compile all contracts |
| \`npm run test\` | Run all tests |
| \`npm run test:sepolia\` | Run tests on Sepolia |
| \`npm run coverage\` | Generate test coverage |
| \`npm run lint\` | Run all linters |
| \`npm run lint:fix\` | Fix linting issues |
| \`npm run format\` | Format code with Prettier |
| \`npm run clean\` | Clean build artifacts |

## Support

For questions and support:
- 📚 [FHEVM Documentation](https://docs.zama.ai/fhevm)
- 💬 [Community Forum](https://community.zama.ai)
- 📧 [GitHub Issues](./issues)

## License

BSD-3-Clause-Clear

## Contributing

Contributions are welcome! Please follow the guidelines in the main repository.

---

**Built with ❤️ for privacy-preserving blockchain applications**
`;

  fs.writeFileSync(path.join(outputDir, "README.md"), readme);
}

/**
 * Create documentation index file
 */
function createDocumentationIndex(
  outputDir: string,
  categoryInfo: CategoryDefinition
): void {
  const docsDir = path.join(outputDir, "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const index = `# ${categoryInfo.name} - Documentation

${categoryInfo.description}

## Examples

${categoryInfo.examples.map((ex) => `### ${ex.name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}

**Location:** \`contracts/*${ex.name}*.sol\`

**Test:** \`test/*${ex.name}*.test.ts\`

[View Contract Source](../${ex.contractPath})
[View Tests](../${ex.testPath})

---`).join("\n\n")}

## Getting Started

1. Review the included examples
2. Study the test files to understand usage patterns
3. Experiment by modifying and extending the examples
4. Deploy to testnet for real-world testing

## Additional Resources

- [FHEVM Protocol Documentation](https://docs.zama.ai/fhevm)
- [Solidity Development Guide](https://docs.zama.ai/fhevm/developers/guides)
- [Hardhat Setup Guide](https://docs.zama.ai/fhevm/developers/hardhat)
`;

  fs.writeFileSync(path.join(docsDir, "index.md"), index);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "\n❌ Usage: npx ts-node scripts/create-fhevm-category.ts <category> <output-dir>\n"
  );
  console.log("Available categories:");
  Object.entries(CATEGORIES).forEach(([key, info]) => {
    console.log(`  ${key.padEnd(20)} - ${info.name} (${info.examples.length} examples)`);
  });
  console.log("");
  process.exit(1);
}

const [category, outputDir] = args;
createCategoryProject(category, outputDir).catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
