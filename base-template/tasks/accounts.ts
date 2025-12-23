import { task } from "hardhat/config";

/**
 * Task to list all available accounts
 */
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  console.log("\nAvailable accounts:");
  console.log("==================\n");

  for (const [index, account] of accounts.entries()) {
    const balance = await hre.ethers.provider.getBalance(account.address);
    const balanceInEth = hre.ethers.formatEther(balance);

    console.log(`Account #${index}: ${account.address}`);
    console.log(`  Balance: ${balanceInEth} ETH\n`);
  }

  console.log(`Total accounts: ${accounts.length}\n`);
});

export {};
