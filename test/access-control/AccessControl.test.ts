import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { AccessControl } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * @chapter access-control
 * @difficulty intermediate
 *
 * Test suite for Access Control contract
 * Demonstrates FHE.allow(), FHE.allowTransient() and permission management patterns
 */
describe("AccessControl", function () {
  let contract: AccessControl;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    const AccessControl = await ethers.getContractFactory("AccessControl");
    contract = await AccessControl.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Secret Storage", function () {
    it("should store encrypted secret", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(12345);
      const encrypted = input.encrypt();

      const tx = await contract.storeSecret(encrypted.data, encrypted.proof);
      await tx.wait();

      const encryptedSecret = await contract.getSecret();
      const decrypted = await fhevm.userDecryptEuint32(encryptedSecret);

      expect(decrypted).to.equal(12345n);
    });

    it("should emit SecretStored event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(100);
      const encrypted = input.encrypt();

      await expect(contract.storeSecret(encrypted.data, encrypted.proof))
        .to.emit(contract, "SecretStored")
        .withArgs(owner.address);
    });
  });

  describe("Permanent Permission Grants", function () {
    it("should grant permanent access permission", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Owner stores secret
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(777);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Grant permission to Alice
      await (await contract.grantPermission(alice.address)).wait();

      // Verify permission
      const hasPermission = await contract.hasPermission(owner.address, alice.address);
      expect(hasPermission).to.be.true;
    });

    it("should emit PermissionGranted event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(50);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      await expect(contract.grantPermission(alice.address))
        .to.emit(contract, "PermissionGranted")
        .withArgs(owner.address, alice.address);
    });

    it("should allow grantee to retrieve encrypted secret", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Owner stores secret
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(999);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Grant permission to Alice
      await (await contract.grantPermission(alice.address)).wait();

      // Alice retrieves owner's secret
      const encryptedSecret = await contract.connect(alice).getSecretOf(owner.address);
      const decrypted = await fhevm.userDecryptEuint32(encryptedSecret);

      expect(decrypted).to.equal(999n);
    });

    it("should reject invalid address", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      await expect(contract.grantPermission(ethers.ZeroAddress)).to.be.revertedWith("Invalid address");
    });
  });

  describe("Transient Permission Grants", function () {
    it("should grant transient time-limited permission", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Store secret
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(555);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Grant transient permission for 100 blocks
      const durationBlocks = 100;
      await (await contract.grantTransientPermission(alice.address, durationBlocks)).wait();

      // Check permission is valid
      const hasPermission = await contract.hasPermission(owner.address, alice.address);
      expect(hasPermission).to.be.true;
    });

    it("should emit TransientPermissionGranted event with expiration", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(111);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      const durationBlocks = 50;
      const currentBlock = await ethers.provider.getBlockNumber();

      await expect(contract.grantTransientPermission(alice.address, durationBlocks))
        .to.emit(contract, "TransientPermissionGranted")
        .withArgs(owner.address, alice.address, currentBlock + durationBlocks + 1);
    });

    it("should allow multiple transient permissions", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(333);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Grant transient permissions to multiple users
      await (await contract.grantTransientPermission(alice.address, 100)).wait();
      await (await contract.grantTransientPermission(bob.address, 200)).wait();

      // Verify both permissions are valid
      const aliceHasPermission = await contract.hasPermission(owner.address, alice.address);
      const bobHasPermission = await contract.hasPermission(owner.address, bob.address);

      expect(aliceHasPermission).to.be.true;
      expect(bobHasPermission).to.be.true;
    });
  });

  describe("Permission Revocation", function () {
    it("should revoke permanent permission", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(444);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Grant then revoke permission
      await (await contract.grantPermission(alice.address)).wait();
      await (await contract.revokePermission(alice.address)).wait();

      // Verify permission was revoked
      const hasPermission = await contract.hasPermission(owner.address, alice.address);
      expect(hasPermission).to.be.false;
    });

    it("should emit PermissionRevoked event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(222);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      await (await contract.grantPermission(alice.address)).wait();

      await expect(contract.revokePermission(alice.address))
        .to.emit(contract, "PermissionRevoked")
        .withArgs(owner.address, alice.address);
    });
  });

  describe("Permission Checks", function () {
    it("should return false for non-granted permissions", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const hasPermission = await contract.hasPermission(owner.address, alice.address);
      expect(hasPermission).to.be.false;
    });

    it("should detect when transient permission expires", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(666);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Grant very short transient permission
      await (await contract.grantTransientPermission(alice.address, 0)).wait();

      // Mine a block to expire the permission
      await ethers.provider.send("evm_mine", []);

      // Permission should now be expired
      const hasPermission = await contract.hasPermission(owner.address, alice.address);
      expect(hasPermission).to.be.false;
    });
  });

  describe("Secret Retrieval", function () {
    it("should allow users to get their own secrets", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(1234);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      const secret = await contract.getSecret();
      const decrypted = await fhevm.userDecryptEuint32(secret);

      expect(decrypted).to.equal(1234n);
    });

    it("should reject unauthorized access to secrets", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(5678);
      const encrypted = input.encrypt();
      await (await contract.storeSecret(encrypted.data, encrypted.proof)).wait();

      // Alice tries to access without permission
      await expect(contract.connect(alice).getSecretOf(owner.address)).to.be.revertedWith(
        "No permission"
      );
    });
  });

  describe("Sepolia Network Tests", function () {
    it("should work on Sepolia testnet", async function () {
      if (hre.network.name !== "sepolia") {
        this.skip();
      }

      this.timeout(160000);

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(888);
      const encrypted = input.encrypt();

      const tx = await contract.storeSecret(encrypted.data, encrypted.proof);
      const receipt = await tx.wait(6);

      expect(receipt).to.exist;
      expect(receipt?.blockNumber).to.be.greaterThan(0);
    });
  });
});
