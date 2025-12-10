import fs from "fs";
import path from "path";

/**
 * Documentation Generator
 *
 * Generates GitBook-compatible markdown documentation from contracts and tests
 * Usage: npx ts-node scripts/generate-docs.ts [example-name]
 */

interface ExampleConfig {
  name: string;
  title: string;
  contractPath: string;
  testPath: string;
  outputPath: string;
  category: string;
  order: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

/**
 * Configuration for documentation generation
 */
const EXAMPLES_CONFIG: ExampleConfig[] = [
  {
    name: "fhe-counter",
    title: "FHE Counter",
    contractPath: "contracts/basic/FHECounter.sol",
    testPath: "test/basic/FHECounter.test.ts",
    outputPath: "docs/basic/01-fhe-counter.md",
    category: "Basic",
    order: 1,
    difficulty: "beginner",
  },
  {
    name: "fhe-add",
    title: "FHE Addition",
    contractPath: "contracts/basic/FHEAdd.sol",
    testPath: "test/basic/FHEAdd.test.ts",
    outputPath: "docs/basic/02-fhe-add.md",
    category: "Basic",
    order: 2,
    difficulty: "beginner",
  },
  {
    name: "encrypt-single-value",
    title: "Encrypt Single Value",
    contractPath: "contracts/encrypt/EncryptSingleValue.sol",
    testPath: "test/encrypt/EncryptSingleValue.test.ts",
    outputPath: "docs/encryption/01-single-value.md",
    category: "Encryption",
    order: 1,
    difficulty: "beginner",
  },
  {
    name: "user-decrypt-single",
    title: "User Decrypt Single Value",
    contractPath: "contracts/decrypt/UserDecryptSingleValue.sol",
    testPath: "test/decrypt/UserDecryptSingleValue.test.ts",
    outputPath: "docs/decryption/01-user-single.md",
    category: "Decryption",
    order: 1,
    difficulty: "beginner",
  },
  {
    name: "access-control",
    title: "Access Control",
    contractPath: "contracts/access-control/AccessControl.sol",
    testPath: "test/access-control/AccessControl.test.ts",
    outputPath: "docs/access-control/01-permission-management.md",
    category: "Access Control",
    order: 1,
    difficulty: "intermediate",
  },
  {
    name: "blind-auction",
    title: "Blind Auction",
    contractPath: "contracts/auctions/BlindAuction.sol",
    testPath: "test/auctions/BlindAuction.test.ts",
    outputPath: "docs/auctions/01-blind-auction.md",
    category: "Auctions",
    order: 1,
    difficulty: "advanced",
  },
  {
    name: "erc7984-basic",
    title: "ERC7984 Basic Token",
    contractPath: "contracts/tokens/ERC7984Basic.sol",
    testPath: "test/tokens/ERC7984Basic.test.ts",
    outputPath: "docs/tokens/01-erc7984-basic.md",
    category: "Tokens",
    order: 1,
    difficulty: "intermediate",
  },
];

/**
 * Generate documentation for a single example
 */
function generateDocumentation(config: ExampleConfig): void {
  console.log(`📝 Generating documentation for: ${config.title}`);

  // Read contract and test files
  const contractCode = readFileIfExists(config.contractPath);
  const testCode = readFileIfExists(config.testPath);

  if (!contractCode) {
    console.warn(`⚠️  Warning: Contract not found: ${config.contractPath}`);
    return;
  }

  // Generate markdown
  const markdown = createMarkdown(config, contractCode, testCode);

  // Write to output
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(config.outputPath, markdown);
  console.log(`✅ Generated: ${config.outputPath}`);
}

/**
 * Read file if it exists
 */
function readFileIfExists(filePath: string): string | null {
  const fullPath = path.join(__dirname, "..", filePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, "utf-8");
  }
  return null;
}

/**
 * Create markdown documentation
 */
function createMarkdown(config: ExampleConfig, contractCode: string, testCode: string | null): string {
  const difficultyBadge = {
    beginner: "🟢 Beginner",
    intermediate: "🟡 Intermediate",
    advanced: "🔴 Advanced",
  }[config.difficulty];

  let markdown = `# ${config.title}

**Difficulty:** ${difficultyBadge}
**Category:** ${config.category}

---

## Overview

This example demonstrates ${config.title.toLowerCase()} using Fully Homomorphic Encryption (FHE).

`;

  // Add file placement hint
  markdown += `{% hint style="info" %}
**File Placement**

To run this example correctly, ensure files are placed in:
- Contract: \`contracts/\` directory
- Test: \`test/\` directory

This ensures Hardhat can compile and test your contracts as expected.
{% endhint %}

---

`;

  // Add contract code
  markdown += `## Smart Contract

\`\`\`solidity
${contractCode}
\`\`\`

---

`;

  // Add test code if available
  if (testCode) {
    markdown += `## Test Suite

\`\`\`typescript
${testCode}
\`\`\`

---

`;
  }

  // Add key concepts section
  markdown += `## Key Concepts

### Encrypted State

This contract uses encrypted types to maintain privacy:
- \`euint32\` / \`euint64\` - Encrypted unsigned integers
- Values remain encrypted on-chain at all times
- Only authorized users can decrypt values

### Permission Management

After FHE operations, always grant appropriate permissions:

\`\`\`solidity
FHE.allowThis(value);        // Allow contract to access
FHE.allow(value, msg.sender); // Allow user to decrypt
\`\`\`

### Input Proofs

External encrypted inputs require zero-knowledge proofs:

\`\`\`solidity
euint32 encrypted = FHE.fromExternal(input, proof);
\`\`\`

The proof ensures:
- Input is validly encrypted
- User authorized the encryption
- Data hasn't been tampered with

---

## Running the Example

### Installation

\`\`\`bash
npm install
\`\`\`

### Compile Contract

\`\`\`bash
npm run compile
\`\`\`

### Run Tests

\`\`\`bash
# Local mock environment
npm run test

# Sepolia testnet
npm run test:sepolia
\`\`\`

### Deploy

\`\`\`bash
# Deploy to Sepolia
npm run deploy:sepolia
\`\`\`

---

## Common Pitfalls

### ❌ Missing Permissions

\`\`\`solidity
// WRONG: No one can access this value
_value = FHE.add(_value, input);
\`\`\`

### ✅ Correct Pattern

\`\`\`solidity
// RIGHT: Grant appropriate permissions
_value = FHE.add(_value, input);
FHE.allowThis(_value);
FHE.allow(_value, msg.sender);
\`\`\`

### ❌ Forgetting Network Checks in Tests

\`\`\`typescript
// WRONG: Will fail on real networks
it("test", async () => {
  const encrypted = fhevm.createEncryptedInput(...); // fhevm undefined
});
\`\`\`

### ✅ Proper Network Handling

\`\`\`typescript
// RIGHT: Check network first
it("test", async function() {
  if (hre.network.name !== "hardhat") this.skip();
  const { fhevm } = hre;
  // ... test code
});
\`\`\`

---

## Next Steps

- Explore more FHE operations in the [FHE library](#)
- Learn about [access control patterns](#)
- Try implementing [your own encrypted contract](#)
- Join the [community forum](#) for support

---

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Solidity FHE Library](https://github.com/zama-ai/fhevm)
- [Example Hub Repository](#)
- [Community Forum](https://community.zama.ai)

`;

  return markdown;
}

/**
 * Update SUMMARY.md with all examples
 */
function updateSummary(): void {
  console.log("\n📚 Updating SUMMARY.md...");

  // Group examples by category
  const categories = new Map<string, ExampleConfig[]>();

  EXAMPLES_CONFIG.forEach((config) => {
    if (!categories.has(config.category)) {
      categories.set(config.category, []);
    }
    categories.get(config.category)!.push(config);
  });

  // Sort each category by order
  categories.forEach((examples) => {
    examples.sort((a, b) => a.order - b.order);
  });

  // Generate SUMMARY.md
  let summary = `# Table of Contents

## Getting Started

* [Introduction](README.md)
* [Quick Start](GETTING_STARTED.md)
* [Core Concepts](CONCEPTS.md)

## Examples

`;

  // Add each category
  const categoryOrder = ["Basic", "Encryption", "Decryption", "Access Control", "Auctions", "Tokens"];

  categoryOrder.forEach((categoryName) => {
    if (categories.has(categoryName)) {
      summary += `\n### ${categoryName}\n\n`;
      categories.get(categoryName)!.forEach((config) => {
        const relativePath = config.outputPath.replace("docs/", "");
        summary += `* [${config.title}](${relativePath})\n`;
      });
    }
  });

  summary += `
## Reference

* [API Reference](reference/api.md)
* [Common Patterns](reference/patterns.md)
* [Troubleshooting](reference/troubleshooting.md)

## Additional Resources

* [Contributing Guide](CONTRIBUTING.md)
* [FAQ](FAQ.md)
`;

  const summaryPath = path.join(__dirname, "..", "docs", "SUMMARY.md");
  const docsDir = path.join(__dirname, "..", "docs");

  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(summaryPath, summary);
  console.log("✅ Updated SUMMARY.md");
}

/**
 * Main execution
 */
function main(): void {
  console.log("\n📖 FHEVM Documentation Generator\n");

  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Generate specific example
    const exampleName = args[0];
    const config = EXAMPLES_CONFIG.find((c) => c.name === exampleName);

    if (!config) {
      console.error(`❌ Error: Example "${exampleName}" not found\n`);
      console.log("Available examples:");
      EXAMPLES_CONFIG.forEach((c) => console.log(`  - ${c.name}`));
      process.exit(1);
    }

    generateDocumentation(config);
  } else {
    // Generate all examples
    console.log("Generating documentation for all examples...\n");
    EXAMPLES_CONFIG.forEach((config) => {
      generateDocumentation(config);
    });

    // Update SUMMARY.md
    updateSummary();
  }

  console.log("\n✅ Documentation generation complete!\n");
}

main();
