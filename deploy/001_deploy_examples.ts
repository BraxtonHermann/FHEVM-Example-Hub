import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy all FHEVM example contracts
 *
 * This script deploys all example contracts to demonstrate FHEVM capabilities
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("\n🚀 Deploying FHEVM Example Contracts...\n");
  console.log(`Deployer address: ${deployer}\n`);

  // Basic Examples
  console.log("📦 Deploying Basic Examples...");

  const fheCounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ FHECounter deployed to: ${fheCounter.address}`);

  const fheAdd = await deploy("FHEAdd", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ FHEAdd deployed to: ${fheAdd.address}`);

  const fheEqual = await deploy("FHEEqual", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ FHEEqual deployed to: ${fheEqual.address}`);

  // Encryption Examples
  console.log("\n📦 Deploying Encryption Examples...");

  const encryptSingle = await deploy("EncryptSingleValue", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ EncryptSingleValue deployed to: ${encryptSingle.address}`);

  const encryptMultiple = await deploy("EncryptMultipleValues", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ EncryptMultipleValues deployed to: ${encryptMultiple.address}`);

  // Decryption Examples
  console.log("\n📦 Deploying Decryption Examples...");

  const userDecryptSingle = await deploy("UserDecryptSingleValue", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ UserDecryptSingleValue deployed to: ${userDecryptSingle.address}`);

  const userDecryptMultiple = await deploy("UserDecryptMultipleValues", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ UserDecryptMultipleValues deployed to: ${userDecryptMultiple.address}`);

  const publicDecryptSingle = await deploy("PublicDecryptSingleValue", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ PublicDecryptSingleValue deployed to: ${publicDecryptSingle.address}`);

  const publicDecryptMultiple = await deploy("PublicDecryptMultipleValues", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ PublicDecryptMultipleValues deployed to: ${publicDecryptMultiple.address}`);

  // Access Control Examples
  console.log("\n📦 Deploying Access Control Examples...");

  const accessControl = await deploy("AccessControl", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ AccessControl deployed to: ${accessControl.address}`);

  // Auction Examples
  console.log("\n📦 Deploying Auction Examples...");

  const blindAuction = await deploy("BlindAuction", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ BlindAuction deployed to: ${blindAuction.address}`);

  // Token Examples
  console.log("\n📦 Deploying Token Examples...");

  const erc7984Basic = await deploy("ERC7984Basic", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
  console.log(`✓ ERC7984Basic deployed to: ${erc7984Basic.address}`);

  console.log("\n✅ All contracts deployed successfully!\n");
  console.log("📋 Deployment Summary:");
  console.log("─────────────────────────────────────────────────────────");
  console.log(`FHECounter:                  ${fheCounter.address}`);
  console.log(`FHEAdd:                      ${fheAdd.address}`);
  console.log(`FHEEqual:                    ${fheEqual.address}`);
  console.log(`EncryptSingleValue:          ${encryptSingle.address}`);
  console.log(`EncryptMultipleValues:       ${encryptMultiple.address}`);
  console.log(`UserDecryptSingleValue:      ${userDecryptSingle.address}`);
  console.log(`UserDecryptMultipleValues:   ${userDecryptMultiple.address}`);
  console.log(`PublicDecryptSingleValue:    ${publicDecryptSingle.address}`);
  console.log(`PublicDecryptMultipleValues: ${publicDecryptMultiple.address}`);
  console.log(`AccessControl:               ${accessControl.address}`);
  console.log(`BlindAuction:                ${blindAuction.address}`);
  console.log(`ERC7984Basic:                ${erc7984Basic.address}`);
  console.log("─────────────────────────────────────────────────────────\n");
};

export default func;
func.id = "deploy_all_examples";
func.tags = [
  "all",
  "examples",
  "basic",
  "encryption",
  "decryption",
  "access-control",
  "auctions",
  "tokens",
];
