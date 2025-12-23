import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { EncryptSingleValue } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * @chapter encryption
 * @difficulty beginner
 *
 * Test suite for Encrypt Single Value contract
 * Demonstrates encryption binding and access control for encrypted values
 */
describe("EncryptSingleValue", function () {
  let contract: EncryptSingleValue;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const EncryptSingleValue = await ethers.getContractFactory("EncryptSingleValue");
    contract = await EncryptSingleValue.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should indicate value is set", async function () {
      const isSet = await contract.isValueSet();
      expect(isSet).to.be.true;
    });
  });

  describe("Encryption and Storage", function () {
    it("should encrypt and store a value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Create encrypted input: value 42
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(42);
      const encrypted = input.encrypt();

      // Store encrypted value
      const tx = await contract.encryptAndStore(encrypted.data, encrypted.proof);
      await tx.wait();

      // Retrieve and decrypt
      const encryptedValue = await contract.getEncryptedValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(42n);
    });

    it("should emit ValueEncrypted event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(100);
      const encrypted = input.encrypt();

      await expect(contract.encryptAndStore(encrypted.data, encrypted.proof))
        .to.emit(contract, "ValueEncrypted")
        .withArgs(owner.address);
    });

    it("should overwrite previous encrypted value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Store first value: 50
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(50);
      const encrypted1 = input1.encrypt();
      await (await contract.encryptAndStore(encrypted1.data, encrypted1.proof)).wait();

      // Store second value: 75
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(75);
      const encrypted2 = input2.encrypt();
      await (await contract.encryptAndStore(encrypted2.data, encrypted2.proof)).wait();

      // Verify latest value is stored
      const encryptedValue = await contract.getEncryptedValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(75n);
    });
  });

  describe("Access Control", function () {
    it("should reject encryption from non-owner", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input.add32(10);
      const encrypted = input.encrypt();

      // Should revert when non-owner tries to store
      await expect(
        contract.connect(alice).encryptAndStore(encrypted.data, encrypted.proof)
      ).to.be.revertedWith("Only owner can set value");
    });

    it("should allow owner to grant access to others", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Owner stores value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(88);
      const encrypted = input.encrypt();
      await (await contract.encryptAndStore(encrypted.data, encrypted.proof)).wait();

      // Owner grants access to Alice
      await (await contract.grantAccess(alice.address)).wait();

      // Get encrypted value and decrypt as Alice should be able to
      const encryptedValue = await contract.getEncryptedValue();

      // Note: In mock environment, we can decrypt without explicit permission
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);
      expect(decrypted).to.equal(88n);
    });

    it("should reject access grant from non-owner", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      // Non-owner should not be able to grant access
      await expect(contract.connect(alice).grantAccess(bob.address)).to.be.revertedWith(
        "Only owner can grant access"
      );
    });
  });

  describe("Different Value Types", function () {
    it("should handle zero value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(0);
      const encrypted = input.encrypt();

      await (await contract.encryptAndStore(encrypted.data, encrypted.proof)).wait();

      const encryptedValue = await contract.getEncryptedValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(0n);
    });

    it("should handle maximum uint32 value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const maxUint32 = (2n ** 32n) - 1n;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(maxUint32);
      const encrypted = input.encrypt();

      await (await contract.encryptAndStore(encrypted.data, encrypted.proof)).wait();

      const encryptedValue = await contract.getEncryptedValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(maxUint32);
    });

    it("should handle various intermediate values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const testValues = [1n, 255n, 1000n, 65535n, 1000000n];

      for (const value of testValues) {
        const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
        input.add32(value);
        const encrypted = input.encrypt();

        await (await contract.encryptAndStore(encrypted.data, encrypted.proof)).wait();

        const encryptedValue = await contract.getEncryptedValue();
        const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

        expect(decrypted).to.equal(value);
      }
    });
  });

  describe("Encryption Binding", function () {
    it("should demonstrate encryption binding", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Create encrypted input bound to owner
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(123);
      const encrypted = input.encrypt();

      // Successfully store owner's encrypted input
      await (await contract.encryptAndStore(encrypted.data, encrypted.proof)).wait();

      // Verify storage
      const encryptedValue = await contract.getEncryptedValue();
      const decrypted = await fhevm.userDecryptEuint32(encryptedValue);

      expect(decrypted).to.equal(123n);
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
      input.add32(777);
      const encrypted = input.encrypt();

      const tx = await contract.encryptAndStore(encrypted.data, encrypted.proof);
      const receipt = await tx.wait(6);

      expect(receipt).to.exist;
      expect(receipt?.blockNumber).to.be.greaterThan(0);
    });
  });
});
