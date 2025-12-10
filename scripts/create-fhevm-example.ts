import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * FHEVM Example Generator
 *
 * Creates standalone example repositories from template
 * Usage: npx ts-node scripts/create-fhevm-example.ts <example-name> <output-dir>
 */

interface ExampleMetadata {
  contract: string;
  test: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
}

/**
 * Map of available examples to their source files
 */
const EXAMPLES_MAP: Record<string, ExampleMetadata> = {
  "fhe-counter": {
    contract: "contracts/basic/FHECounter.sol",
    test: "test/basic/FHECounter.test.ts",
    title: "FHE Counter",
    description: "Encrypted counter demonstrating basic FHE operations",
    difficulty: "beginner",
    category: "basic",
  },
  "fhe-add": {
    contract: "contracts/basic/FHEAdd.sol",
    test: "test/basic/FHEAdd.test.ts",
    title: "FHE Addition",
    description: "Demonstrates encrypted addition operations",
    difficulty: "beginner",
    category: "basic",
  },
  "encrypt-single-value": {
    contract: "contracts/encrypt/EncryptSingleValue.sol",
    test: "test/encrypt/EncryptSingleValue.test.ts",
    title: "Encrypt Single Value",
    description: "Demonstrates single value encryption and storage",
    difficulty: "beginner",
    category: "encryption",
  },
  "user-decrypt-single": {
    contract: "contracts/decrypt/UserDecryptSingleValue.sol",
    test: "test/decrypt/UserDecryptSingleValue.test.ts",
    title: "User Decrypt Single Value",
    description: "Demonstrates user-side decryption patterns",
    difficulty: "beginner",
    category: "decryption",
  },
  "access-control": {
    contract: "contracts/access-control/AccessControl.sol",
    test: "test/access-control/AccessControl.test.ts",
    title: "Access Control",
    description: "FHE.allow() and permission management patterns",
    difficulty: "intermediate",
    category: "access-control",
  },
  "blind-auction": {
    contract: "contracts/auctions/BlindAuction.sol",
    test: "test/auctions/BlindAuction.test.ts",
    title: "Blind Auction",
    description: "Confidential auction with encrypted bids",
    difficulty: "advanced",
    category: "auctions",
  },
  "erc7984-basic": {
    contract: "contracts/tokens/ERC7984Basic.sol",
    test: "test/tokens/ERC7984Basic.test.ts",
    title: "ERC7984 Basic Token",
    description: "Confidential token with encrypted balances",
    difficulty: "intermediate",
    category: "tokens",
  },
};

/**
 * Main example generation function
 */
async function createExample(exampleName: string, outputDir: string): Promise<void> {
  console.log("\n🚀 FHEVM Example Generator\n");

  // Validate example exists
  if (!EXAMPLES_MAP[exampleName]) {
    console.error(`❌ Error: Example "${exampleName}" not found\n`);
    console.log("Available examples:");
    Object.keys(EXAMPLES_MAP).forEach((name) => {
      console.log(`  - ${name}: ${EXAMPLES_MAP[name].title}`);
    });
    process.exit(1);
  }

  const example = EXAMPLES_MAP[exampleName];
  console.log(`📦 Creating example: ${example.title}`);
  console.log(`📂 Output directory: ${outputDir}\n`);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 1: Copy base template
  console.log("1️⃣  Copying base template...");
  copyTemplate(outputDir);

  // Step 2: Copy contract
  console.log("2️⃣  Copying contract...");
  copyContract(example.contract, outputDir);

  // Step 3: Copy test
  console.log("3️⃣  Copying test file...");
  copyTest(example.test, outputDir);

  // Step 4: Update package.json
  console.log("4️⃣  Updating package.json...");
  updatePackageJson(outputDir, exampleName, example);

  // Step 5: Generate README
  console.log("5️⃣  Generating README.md...");
  generateReadme(outputDir, example);

  // Step 6: Update deployment script
  console.log("6️⃣  Updating deployment script...");
  updateDeploymentScript(outputDir, example.contract);

  console.log("\n✅ Example created successfully!");
  console.log("\nNext steps:");
  console.log(`  cd ${outputDir}`);
  console.log(`  npm install`);
  console.log(`  npm run compile`);
  console.log(`  npm run test\n`);
}

/**
 * Copy base Hardhat template
 */
function copyTemplate(outputDir: string): void {
  const templateDir = path.join(__dirname, "..", "base-template");

  if (!fs.existsSync(templateDir)) {
    console.warn("⚠️  Warning: Base template not found, creating minimal structure");
    createMinimalTemplate(outputDir);
    return;
  }

  try {
    execSync(`cp -r "${templateDir}"/* "${outputDir}"/`, { stdio: "ignore" });
  } catch (error) {
    console.warn("⚠️  Warning: Using minimal template structure");
    createMinimalTemplate(outputDir);
  }
}

/**
 * Create minimal template structure
 */
function createMinimalTemplate(outputDir: string): void {
  const dirs = ["contracts", "test", "scripts", "tasks"];
  dirs.forEach((dir) => {
    const dirPath = path.join(outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Copy contract file
 */
function copyContract(contractPath: string, outputDir: string): void {
  const sourcePath = path.join(__dirname, "..", contractPath);
  const contractName = path.basename(contractPath);
  const destPath = path.join(outputDir, "contracts", contractName);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Error: Contract not found at ${sourcePath}`);
    process.exit(1);
  }

  fs.copyFileSync(sourcePath, destPath);
}

/**
 * Copy test file
 */
function copyTest(testPath: string, outputDir: string): void {
  const sourcePath = path.join(__dirname, "..", testPath);
  const testName = path.basename(testPath);
  const destPath = path.join(outputDir, "test", testName);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Warning: Test file not found at ${sourcePath}`);
    return;
  }

  fs.copyFileSync(sourcePath, destPath);
}

/**
 * Update package.json with example metadata
 */
function updatePackageJson(outputDir: string, exampleName: string, example: ExampleMetadata): void {
  const packageJsonPath = path.join(outputDir, "package.json");

  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
    : {};

  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.version = packageJson.version || "1.0.0";
  packageJson.description = example.description;
  packageJson.keywords = [
    "fhevm",
    "fhe",
    "blockchain",
    "privacy",
    "encryption",
    example.category,
  ];

  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts = {
    ...packageJson.scripts,
    compile: "hardhat compile",
    test: "hardhat test",
    "test:sepolia": "HARDHAT_NETWORK=sepolia hardhat test",
    deploy: "hardhat run scripts/deploy.ts",
    "deploy:sepolia": "hardhat run scripts/deploy.ts --network sepolia",
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Generate README for example
 */
function generateReadme(outputDir: string, example: ExampleMetadata): void {
  const contractName = path.basename(example.contract, ".sol");

  const readme = `# ${example.title}

${example.description}

**Category:** ${example.category}
**Difficulty:** ${example.difficulty}

## Overview

This example demonstrates ${example.description.toLowerCase()}.

## What You'll Learn

- Encrypted state management with FHEVM
- FHE operations on encrypted values
- Permission management patterns
- Testing encrypted smart contracts

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npm run deploy:sepolia
\`\`\`

## Contract

The main contract is located at \`contracts/${contractName}.sol\`.

Key features:
- Encrypted state variables using euint types
- FHE operations (add, sub, comparison)
- Permission management with FHE.allow()
- Input proof validation

## Testing

Tests are located in \`test/${contractName}.test.ts\`.

Run tests:
\`\`\`bash
# Local mock environment
npm run test

# Sepolia testnet
npm run test:sepolia
\`\`\`

## Key Concepts

### Encrypted Types

\`\`\`solidity
euint32 private _value;  // Encrypted 32-bit unsigned integer
\`\`\`

### Permission Management

\`\`\`solidity
FHE.allowThis(_value);        // Contract can access
FHE.allow(_value, msg.sender); // User can decrypt
\`\`\`

### Input Validation

\`\`\`solidity
euint32 encrypted = FHE.fromExternal(input, proof);
\`\`\`

## Common Pitfalls

❌ **Missing Permissions**
\`\`\`solidity
_value = FHE.add(_value, input); // Wrong: No one can access
\`\`\`

✅ **Correct Pattern**
\`\`\`solidity
_value = FHE.add(_value, input);
FHE.allowThis(_value);
FHE.allow(_value, msg.sender);
\`\`\`

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Example Hub Repository](#)
- [Community Forum](https://community.zama.ai)

## License

BSD-3-Clause-Clear
`;

  fs.writeFileSync(path.join(outputDir, "README.md"), readme);
}

/**
 * Update deployment script with correct contract name
 */
function updateDeploymentScript(outputDir: string, contractPath: string): void {
  const contractName = path.basename(contractPath, ".sol");
  const deployScriptPath = path.join(outputDir, "scripts", "deploy.ts");

  const deployScript = `import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ${contractName}...");

  const Contract = await ethers.getContractFactory("${contractName}");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log("${contractName} deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

  fs.writeFileSync(deployScriptPath, deployScript);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("\n❌ Usage: npx ts-node scripts/create-fhevm-example.ts <example-name> <output-dir>\n");
  console.log("Available examples:");
  Object.entries(EXAMPLES_MAP).forEach(([name, meta]) => {
    console.log(`  ${name.padEnd(25)} - ${meta.title}`);
  });
  console.log("");
  process.exit(1);
}

const [exampleName, outputDir] = args;
createExample(exampleName, outputDir).catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
