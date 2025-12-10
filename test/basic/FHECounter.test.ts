import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { FHECounter } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * @chapter basic-operations
 * @difficulty beginner
 *
 * Test suite for FHE Counter contract
 * Demonstrates encrypted state management and basic FHE operations
 */
describe("FHECounter", function () {
  let contract: FHECounter;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const FHECounter = await ethers.getContractFactory("FHECounter");
    contract = await FHECounter.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should initialize with encrypted zero", async function () {
      const count = await contract.getCount();
      expect(count).to.exist;
    });
  });

  describe("Increment Operations", function () {
    it("should increment counter by encrypted value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Create encrypted input: value 5
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(5);
      const encrypted = input.encrypt();

      // Call increment
      const tx = await contract.increment(encrypted.data, encrypted.proof);
      await tx.wait();

      // Retrieve encrypted count
      const encryptedCount = await contract.getCount();

      // Decrypt and verify
      const decrypted = await fhevm.userDecryptEuint32(encryptedCount);
      expect(decrypted).to.equal(5n);
    });

    it("should handle multiple sequential increments", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // First increment: +3
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(3);
      const encrypted1 = input1.encrypt();
      await (await contract.increment(encrypted1.data, encrypted1.proof)).wait();

      // Second increment: +7
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(7);
      const encrypted2 = input2.encrypt();
      await (await contract.increment(encrypted2.data, encrypted2.proof)).wait();

      // Verify total: 3 + 7 = 10
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint32(encryptedCount);
      expect(decrypted).to.equal(10n);
    });

    it("should allow different users to increment", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Alice increments by 4
      const inputAlice = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      inputAlice.add32(4);
      const encryptedAlice = inputAlice.encrypt();
      await (await contract.connect(alice).increment(encryptedAlice.data, encryptedAlice.proof)).wait();

      // Bob increments by 6
      const inputBob = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      inputBob.add32(6);
      const encryptedBob = inputBob.encrypt();
      await (await contract.connect(bob).increment(encryptedBob.data, encryptedBob.proof)).wait();

      // Verify total: 4 + 6 = 10
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint32(encryptedCount);
      expect(decrypted).to.equal(10n);
    });

    it("should emit CountIncremented event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(1);
      const encrypted = input.encrypt();

      await expect(contract.increment(encrypted.data, encrypted.proof))
        .to.emit(contract, "CountIncremented")
        .withArgs(owner.address);
    });
  });

  describe("Decrement Operations", function () {
    it("should decrement counter by encrypted value", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Setup: increment to 20
      const inputUp = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      inputUp.add32(20);
      const encryptedUp = inputUp.encrypt();
      await (await contract.increment(encryptedUp.data, encryptedUp.proof)).wait();

      // Decrement by 8
      const inputDown = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      inputDown.add32(8);
      const encryptedDown = inputDown.encrypt();
      await (await contract.decrement(encryptedDown.data, encryptedDown.proof)).wait();

      // Verify: 20 - 8 = 12
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint32(encryptedCount);
      expect(decrypted).to.equal(12n);
    });

    it("should emit CountDecremented event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(1);
      const encrypted = input.encrypt();

      await expect(contract.decrement(encrypted.data, encrypted.proof))
        .to.emit(contract, "CountDecremented")
        .withArgs(owner.address);
    });
  });

  describe("Reset Operation", function () {
    it("should reset counter to zero", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Increment to 42
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(42);
      const encrypted = input.encrypt();
      await (await contract.increment(encrypted.data, encrypted.proof)).wait();

      // Reset
      await contract.reset();

      // Verify reset to zero
      const encryptedCount = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint32(encryptedCount);
      expect(decrypted).to.equal(0n);
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(0);
      const encrypted = input.encrypt();

      await (await contract.increment(encrypted.data, encrypted.proof)).wait();

      const result = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint32(result);
      expect(decrypted).to.equal(0n);
    });

    it("should handle maximum uint32 values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const maxUint32 = (2n ** 32n) - 1n;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(maxUint32);
      const encrypted = input.encrypt();

      await (await contract.increment(encrypted.data, encrypted.proof)).wait();

      const result = await contract.getCount();
      const decrypted = await fhevm.userDecryptEuint32(result);
      expect(decrypted).to.equal(maxUint32);
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
      input.add32(42);
      const encrypted = input.encrypt();

      const tx = await contract.increment(encrypted.data, encrypted.proof);
      const receipt = await tx.wait(6);

      expect(receipt).to.exist;
      expect(receipt?.blockNumber).to.be.greaterThan(0);
    });
  });
});
