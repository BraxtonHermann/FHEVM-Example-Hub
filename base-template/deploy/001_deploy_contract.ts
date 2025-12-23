import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy example contract
 *
 * This is a template deployment script that will be customized
 * by the automation tools when generating standalone examples
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("\n🚀 Deploying Contract...\n");
  console.log(`Deployer address: ${deployer}\n`);

  // Deploy the main contract
  // NOTE: Contract name will be replaced by automation script
  const contract = await deploy("ExampleContract", {
    from: deployer,
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 6 : 1,
  });

  console.log(`\n✅ Contract deployed to: ${contract.address}\n`);

  // Verify on Etherscan if on Sepolia
  if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan\n");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified on Etherscan\n");
      } else {
        console.error("Error verifying contract:", error.message);
      }
    }
  }

  return true;
};

export default func;
func.id = "deploy_example";
func.tags = ["all", "example"];
