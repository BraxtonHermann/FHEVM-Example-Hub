import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { FHEAdd } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * @chapter basic-operations
 * @difficulty beginner
 *
 * Test suite for FHE Addition contract
 * Demonstrates encrypted addition operations and state management
 */
describe("FHEAdd", function () {
  let contract: FHEAdd;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const FHEAdd = await ethers.getContractFactory("FHEAdd");
    contract = await FHEAdd.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("Two Value Addition", function () {
    it("should add two encrypted values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Create first encrypted value: 15
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(15);
      const encrypted1 = input1.encrypt();

      // Create second encrypted value: 25
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(25);
      const encrypted2 = input2.encrypt();

      // Call add function
      const tx = await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof);
      await tx.wait();

      // Retrieve and decrypt result
      const encryptedSum = await contract.getSum();
      const decrypted = await fhevm.userDecryptEuint32(encryptedSum);

      expect(decrypted).to.equal(40n);
    });

    it("should store result for calling user", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Create encrypted values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(10);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(20);
      const encrypted2 = input2.encrypt();

      // Perform addition
      await (await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof)).wait();

      // Get user's stored sum
      const userSum = await contract.getUserSum(owner.address);
      const decrypted = await fhevm.userDecryptEuint32(userSum);

      expect(decrypted).to.equal(30n);
    });

    it("should emit AdditionPerformed event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(5);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(10);
      const encrypted2 = input2.encrypt();

      await expect(contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof))
        .to.emit(contract, "AdditionPerformed")
        .withArgs(owner.address, owner.address);
    });
  });

  describe("Accumulative Addition", function () {
    it("should add encrypted value to existing sum", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // First addition: 30 + 20 = 50
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(30);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(20);
      const encrypted2 = input2.encrypt();

      await (await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof)).wait();

      // Add to sum: 50 + 15 = 65
      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add32(15);
      const encrypted3 = input3.encrypt();

      await (await contract.addToSum(encrypted3.data, encrypted3.proof)).wait();

      // Verify result
      const encryptedSum = await contract.getSum();
      const decrypted = await fhevm.userDecryptEuint32(encryptedSum);

      expect(decrypted).to.equal(65n);
    });

    it("should handle multiple sequential additions to sum", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Initialize with 10 + 5 = 15
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(10);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(5);
      const encrypted2 = input2.encrypt();

      await (await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof)).wait();

      // Add sequence: +3, +7, +5
      const additions = [3, 7, 5];
      for (const value of additions) {
        const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
        input.add32(value);
        const encrypted = input.encrypt();
        await (await contract.addToSum(encrypted.data, encrypted.proof)).wait();
      }

      // Verify final sum: 15 + 3 + 7 + 5 = 30
      const encryptedSum = await contract.getSum();
      const decrypted = await fhevm.userDecryptEuint32(encryptedSum);

      expect(decrypted).to.equal(30n);
    });
  });

  describe("Multi-User Operations", function () {
    it("should track separate sums for different users", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Alice adds 7 + 3 = 10
      const aliceInput1 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      aliceInput1.add32(7);
      const aliceEncrypted1 = aliceInput1.encrypt();

      const aliceInput2 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      aliceInput2.add32(3);
      const aliceEncrypted2 = aliceInput2.encrypt();

      await (
        await contract
          .connect(alice)
          .add(aliceEncrypted1.data, aliceEncrypted1.proof, aliceEncrypted2.data, aliceEncrypted2.proof)
      ).wait();

      // Bob adds 12 + 8 = 20
      const bobInput1 = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      bobInput1.add32(12);
      const bobEncrypted1 = bobInput1.encrypt();

      const bobInput2 = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      bobInput2.add32(8);
      const bobEncrypted2 = bobInput2.encrypt();

      await (
        await contract
          .connect(bob)
          .add(bobEncrypted1.data, bobEncrypted1.proof, bobEncrypted2.data, bobEncrypted2.proof)
      ).wait();

      // Verify Alice's sum
      const aliceSum = await contract.getUserSum(alice.address);
      const aliceDecrypted = await fhevm.userDecryptEuint32(aliceSum);
      expect(aliceDecrypted).to.equal(10n);

      // Verify Bob's sum
      const bobSum = await contract.getUserSum(bob.address);
      const bobDecrypted = await fhevm.userDecryptEuint32(bobSum);
      expect(bobDecrypted).to.equal(20n);
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(0);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(0);
      const encrypted2 = input2.encrypt();

      await (await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof)).wait();

      const encryptedSum = await contract.getSum();
      const decrypted = await fhevm.userDecryptEuint32(encryptedSum);

      expect(decrypted).to.equal(0n);
    });

    it("should handle large values", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const largeValue = 1000000n;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(largeValue);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(largeValue);
      const encrypted2 = input2.encrypt();

      await (await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof)).wait();

      const encryptedSum = await contract.getSum();
      const decrypted = await fhevm.userDecryptEuint32(encryptedSum);

      expect(decrypted).to.equal(largeValue * 2n);
    });
  });

  describe("Sepolia Network Tests", function () {
    it("should work on Sepolia testnet", async function () {
      if (hre.network.name !== "sepolia") {
        this.skip();
      }

      this.timeout(160000);

      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(200);
      const encrypted2 = input2.encrypt();

      const tx = await contract.add(encrypted1.data, encrypted1.proof, encrypted2.data, encrypted2.proof);
      const receipt = await tx.wait(6);

      expect(receipt).to.exist;
      expect(receipt?.blockNumber).to.be.greaterThan(0);
    });
  });
});
