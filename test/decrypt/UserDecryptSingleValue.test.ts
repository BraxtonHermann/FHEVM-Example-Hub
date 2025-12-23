import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { UserDecryptSingleValue } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * @chapter decryption
 * @difficulty beginner
 *
 * Test suite for User Decrypt Single Value contract
 * Demonstrates user-side decryption with permission management
 */
describe("UserDecryptSingleValue", function () {
  let contract: UserDecryptSingleValue;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    const UserDecryptSingleValue = await ethers.getContractFactory("UserDecryptSingleValue");
    contract = await UserDecryptSingleValue.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Storing Encrypted Values", function () {
    it("should store encrypted value for user", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Create encrypted input
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(555);
      const encrypted = input.encrypt();

      // Store value
      const tx = await contract.storeEncryptedValue(encrypted.data, encrypted.proof);
      await tx.wait();

      // Retrieve and decrypt
      const encryptedValue = await contract.getMyValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(555n);
    });

    it("should emit ValueStored event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(100);
      const encrypted = input.encrypt();

      await expect(contract.storeEncryptedValue(encrypted.data, encrypted.proof))
        .to.emit(contract, "ValueStored")
        .withArgs(owner.address);
    });

    it("should allow each user to have their own encrypted value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Owner stores 100
      const inputOwner = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      inputOwner.add32(100);
      const encryptedOwner = inputOwner.encrypt();
      await (await contract.storeEncryptedValue(encryptedOwner.data, encryptedOwner.proof)).wait();

      // Alice stores 200
      const inputAlice = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      inputAlice.add32(200);
      const encryptedAlice = inputAlice.encrypt();
      await (
        await contract.connect(alice).storeEncryptedValue(encryptedAlice.data, encryptedAlice.proof)
      ).wait();

      // Bob stores 300
      const inputBob = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      inputBob.add32(300);
      const encryptedBob = inputBob.encrypt();
      await (await contract.connect(bob).storeEncryptedValue(encryptedBob.data, encryptedBob.proof)).wait();

      // Verify each user can retrieve their own value
      const ownerValue = await contract.getMyValue();
      const ownerDecrypted = await fhevm.userDecryptEuint32(ownerValue);
      expect(ownerDecrypted).to.equal(100n);

      const aliceValue = await contract.connect(alice).getMyValue();
      const aliceDecrypted = await fhevm.userDecryptEuint32(aliceValue);
      expect(aliceDecrypted).to.equal(200n);

      const bobValue = await contract.connect(bob).getMyValue();
      const bobDecrypted = await fhevm.userDecryptEuint32(bobValue);
      expect(bobDecrypted).to.equal(300n);
    });
  });

  describe("Permission Management", function () {
    it("should grant decryption permission to another user", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Owner stores encrypted value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(777);
      const encrypted = input.encrypt();
      await (await contract.storeEncryptedValue(encrypted.data, encrypted.proof)).wait();

      // Owner grants permission to Alice
      await (await contract.grantDecryptPermission(alice.address)).wait();

      // Verify permission was granted
      const grantees = await contract.getAccessGrantees(owner.address);
      expect(grantees).to.include(alice.address);
    });

    it("should emit AccessGranted event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Store value first
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(50);
      const encrypted = input.encrypt();
      await (await contract.storeEncryptedValue(encrypted.data, encrypted.proof)).wait();

      // Grant permission
      await expect(contract.grantDecryptPermission(alice.address))
        .to.emit(contract, "AccessGranted")
        .withArgs(owner.address, alice.address);
    });

    it("should allow multiple users to be granted decryption permission", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Store value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(888);
      const encrypted = input.encrypt();
      await (await contract.storeEncryptedValue(encrypted.data, encrypted.proof)).wait();

      // Grant permission to multiple users
      await (await contract.grantDecryptPermission(alice.address)).wait();
      await (await contract.grantDecryptPermission(bob.address)).wait();
      await (await contract.grantDecryptPermission(charlie.address)).wait();

      // Verify all permissions were granted
      const grantees = await contract.getAccessGrantees(owner.address);
      expect(grantees).to.have.lengthOf(3);
      expect(grantees).to.include(alice.address);
      expect(grantees).to.include(bob.address);
      expect(grantees).to.include(charlie.address);
    });

    it("should track grantees separately for each user", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Owner stores and grants to Alice
      const inputOwner = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      inputOwner.add32(111);
      const encryptedOwner = inputOwner.encrypt();
      await (await contract.storeEncryptedValue(encryptedOwner.data, encryptedOwner.proof)).wait();
      await (await contract.grantDecryptPermission(alice.address)).wait();

      // Alice stores and grants to Bob
      const inputAlice = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      inputAlice.add32(222);
      const encryptedAlice = inputAlice.encrypt();
      await (
        await contract.connect(alice).storeEncryptedValue(encryptedAlice.data, encryptedAlice.proof)
      ).wait();
      await (await contract.connect(alice).grantDecryptPermission(bob.address)).wait();

      // Verify separate permission lists
      const ownerGrantees = await contract.getAccessGrantees(owner.address);
      const aliceGrantees = await contract.getAccessGrantees(alice.address);

      expect(ownerGrantees).to.include(alice.address);
      expect(ownerGrantees).not.to.include(bob.address);

      expect(aliceGrantees).to.include(bob.address);
      expect(aliceGrantees).not.to.include(owner.address);
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero value storage", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(0);
      const encrypted = input.encrypt();

      await (await contract.storeEncryptedValue(encrypted.data, encrypted.proof)).wait();

      const encryptedValue = await contract.getMyValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(0n);
    });

    it("should handle maximum uint32 value storage", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const maxUint32 = (2n ** 32n) - 1n;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(maxUint32);
      const encrypted = input.encrypt();

      await (await contract.storeEncryptedValue(encrypted.data, encrypted.proof)).wait();

      const encryptedValue = await contract.getMyValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(maxUint32);
    });

    it("should indicate stored value exists", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const hasValue = await contract.hasStoredValue(owner.address);
      expect(hasValue).to.be.true;
    });
  });

  describe("Value Updates", function () {
    it("should allow user to update their encrypted value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Store initial value
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(111);
      const encrypted1 = input1.encrypt();
      await (await contract.storeEncryptedValue(encrypted1.data, encrypted1.proof)).wait();

      // Update to new value
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(222);
      const encrypted2 = input2.encrypt();
      await (await contract.storeEncryptedValue(encrypted2.data, encrypted2.proof)).wait();

      // Verify updated value
      const encryptedValue = await contract.getMyValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(222n);
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
      input.add32(999);
      const encrypted = input.encrypt();

      const tx = await contract.storeEncryptedValue(encrypted.data, encrypted.proof);
      const receipt = await tx.wait(6);

      expect(receipt).to.exist;
      expect(receipt?.blockNumber).to.be.greaterThan(0);
    });
  });
});
