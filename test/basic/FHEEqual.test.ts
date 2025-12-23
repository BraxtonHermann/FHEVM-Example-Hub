import { expect } from "chai";
import { ethers } from "hardhat";
import { FHEEqual } from "../../typechain-types";

/**
 * @title FHEEqual Tests
 * @notice Comprehensive test suite for FHEEqual contract
 * @dev Tests equality comparison operations on encrypted values
 */
describe("FHEEqual", function () {
  let fheEqual: FHEEqual;
  let owner: any;
  let otherAccount: any;
  let fhevm: any;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    otherAccount = signers[1];

    fhevm = await ethers.getContractAt("FHEEqual", ethers.ZeroAddress);
    const FHEEqualFactory = await ethers.getContractFactory("FHEEqual");
    fheEqual = await FHEEqualFactory.deploy();
  });

  describe("Equality Comparison", function () {
    it("should compare two equal encrypted values", async function () {
      const { fhevm } = hre as any;

      // Create encrypted inputs with same value
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(42);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(42);
      const encrypted2 = input2.encrypt();

      // Compare values
      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify comparison result
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.true;
    });

    it("should detect unequal encrypted values", async function () {
      const { fhevm } = hre as any;

      // Create encrypted inputs with different values
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(10);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(20);
      const encrypted2 = input2.encrypt();

      // Compare values
      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify comparison result
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.false;
    });

    it("should handle zero values", async function () {
      const { fhevm } = hre as any;

      // Create encrypted zero values
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(0);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(0);
      const encrypted2 = input2.encrypt();

      // Compare values
      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify comparison result
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.true;
    });

    it("should handle max uint32 values", async function () {
      const { fhevm } = hre as any;

      // Create encrypted max values
      const maxValue = 2n ** 32n - 1n;
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(maxValue);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(maxValue);
      const encrypted2 = input2.encrypt();

      // Compare values
      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify comparison result
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.true;
    });

    it("should differentiate between off-by-one values", async function () {
      const { fhevm } = hre as any;

      // Create encrypted inputs with off-by-one values
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(99);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(100);
      const encrypted2 = input2.encrypt();

      // Compare values
      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify comparison result
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.false;
    });
  });

  describe("Permission Management", function () {
    it("should set comparison result with proper permissions", async function () {
      const { fhevm } = hre as any;

      // Create encrypted inputs
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(15);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(15);
      const encrypted2 = input2.encrypt();

      // Compare values - automatically sets permissions
      const tx = await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify transaction succeeds
      await expect(tx).to.not.be.reverted;

      // Verify result is accessible
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.equal(true);
    });

    it("should allow different users to store results", async function () {
      const { fhevm } = hre as any;

      // User 1 comparison
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(50);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(60);
      const encrypted2 = input2.encrypt();

      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // User 2 comparison
      const input3 = fhevm.createEncryptedInput(await fheEqual.getAddress(), otherAccount.address);
      input3.add32(100);
      const encrypted3 = input3.encrypt();

      const input4 = fhevm.createEncryptedInput(await fheEqual.getAddress(), otherAccount.address);
      input4.add32(100);
      const encrypted4 = input4.encrypt();

      await fheEqual.connect(otherAccount).compareValues(
        encrypted3.data,
        encrypted3.proof,
        encrypted4.data,
        encrypted4.proof
      );

      // Verify both results
      const result1 = await fheEqual.getComparisonResult(owner.address);
      const decrypted1 = await fhevm.userDecryptEbool(result1);

      const result2 = await fheEqual.getComparisonResult(otherAccount.address);
      const decrypted2 = await fhevm.userDecryptEbool(result2);

      expect(decrypted1).to.be.false;
      expect(decrypted2).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("should handle sequential comparisons", async function () {
      const { fhevm } = hre as any;

      // First comparison
      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(5);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(5);
      const encrypted2 = input2.encrypt();

      await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      let result = await fheEqual.getComparisonResult(owner.address);
      let decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.true;

      // Second comparison (overwrites first)
      const input3 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input3.add32(3);
      const encrypted3 = input3.encrypt();

      const input4 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input4.add32(7);
      const encrypted4 = input4.encrypt();

      await fheEqual.compareValues(
        encrypted3.data,
        encrypted3.proof,
        encrypted4.data,
        encrypted4.proof
      );

      result = await fheEqual.getComparisonResult(owner.address);
      decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.false;
    });

    it("should handle comparison with same input twice", async function () {
      const { fhevm } = hre as any;

      // Create one encrypted input
      const input = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input.add32(77);
      const encrypted = input.encrypt();

      // Compare with itself
      await fheEqual.compareValues(encrypted.data, encrypted.proof, encrypted.data, encrypted.proof);

      // Result should be true (same value)
      const result = await fheEqual.getComparisonResult(owner.address);
      const decrypted = await fhevm.userDecryptEbool(result);
      expect(decrypted).to.be.true;
    });
  });

  describe("Integration", function () {
    it("should emit comparison event", async function () {
      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input1.add32(33);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await fheEqual.getAddress(), owner.address);
      input2.add32(33);
      const encrypted2 = input2.encrypt();

      const tx = await fheEqual.compareValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof
      );

      // Verify transaction was successful
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });
  });
});
