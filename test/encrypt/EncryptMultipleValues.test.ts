import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptMultipleValues } from "../../typechain-types";

/**
 * @title EncryptMultipleValues Tests
 * @notice Comprehensive test suite for encrypting and storing multiple values
 * @dev Tests batch encryption patterns and multiple value management
 */
describe("EncryptMultipleValues", function () {
  let contract: EncryptMultipleValues;
  let owner: any;
  let otherAccount: any;
  let fhevm: any;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    otherAccount = signers[1];

    fhevm = await ethers.getContractAt("EncryptMultipleValues", ethers.ZeroAddress);
    const Factory = await ethers.getContractFactory("EncryptMultipleValues");
    contract = await Factory.deploy();
  });

  describe("Multiple Value Encryption", function () {
    it("should store multiple encrypted values", async function () {
      const { fhevm } = hre as any;

      // Create inputs for three values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(200);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(300000);
      const encrypted3 = input3.encrypt();

      // Store multiple values
      await contract.encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Retrieve and verify values
      const storedData = await contract.getStoredValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(100);
      expect(dec2).to.equal(200);
      expect(dec3).to.equal(300000);
    });

    it("should handle different value ranges", async function () {
      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), otherAccount.address);
      input1.add32(1);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), otherAccount.address);
      input2.add32(2n ** 32n - 1n);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), otherAccount.address);
      input3.add64(2n ** 64n - 1n);
      const encrypted3 = input3.encrypt();

      await contract.connect(otherAccount).encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      const storedData = await contract.getStoredValues(otherAccount.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(1);
      expect(dec2).to.equal(2n ** 32n - 1n);
      expect(dec3).to.equal(2n ** 64n - 1n);
    });

    it("should support overwriting stored values", async function () {
      const { fhevm } = hre as any;

      // First storage
      const input1a = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1a.add32(50);
      const encrypted1a = input1a.encrypt();

      const input2a = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2a.add32(60);
      const encrypted2a = input2a.encrypt();

      const input3a = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3a.add64(70000);
      const encrypted3a = input3a.encrypt();

      await contract.encryptAndStore(
        encrypted1a.data,
        encrypted1a.proof,
        encrypted2a.data,
        encrypted2a.proof,
        encrypted3a.data,
        encrypted3a.proof
      );

      // Overwrite with new values
      const input1b = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1b.add32(150);
      const encrypted1b = input1b.encrypt();

      const input2b = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2b.add32(160);
      const encrypted2b = input2b.encrypt();

      const input3b = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3b.add64(170000);
      const encrypted3b = input3b.encrypt();

      await contract.encryptAndStore(
        encrypted1b.data,
        encrypted1b.proof,
        encrypted2b.data,
        encrypted2b.proof,
        encrypted3b.data,
        encrypted3b.proof
      );

      // Verify new values are stored
      const storedData = await contract.getStoredValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(150);
      expect(dec2).to.equal(160);
      expect(dec3).to.equal(170000);
    });
  });

  describe("Multiple User Storage", function () {
    it("should maintain separate encrypted data per user", async function () {
      const { fhevm } = hre as any;

      // Owner stores data
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(111);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(222);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(333000);
      const encrypted3 = input3.encrypt();

      await contract.encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Other account stores different data
      const input4 = fhevm.createEncryptedInput(await contract.getAddress(), otherAccount.address);
      input4.add32(444);
      const encrypted4 = input4.encrypt();

      const input5 = fhevm.createEncryptedInput(await contract.getAddress(), otherAccount.address);
      input5.add32(555);
      const encrypted5 = input5.encrypt();

      const input6 = fhevm.createEncryptedInput(await contract.getAddress(), otherAccount.address);
      input6.add64(666000);
      const encrypted6 = input6.encrypt();

      await contract.connect(otherAccount).encryptAndStore(
        encrypted4.data,
        encrypted4.proof,
        encrypted5.data,
        encrypted5.proof,
        encrypted6.data,
        encrypted6.proof
      );

      // Verify owner's data
      let storedData = await contract.getStoredValues(owner.address);
      let dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      let dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      let dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(111);
      expect(dec2).to.equal(222);
      expect(dec3).to.equal(333000);

      // Verify other account's data
      storedData = await contract.getStoredValues(otherAccount.address);
      dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(444);
      expect(dec2).to.equal(555);
      expect(dec3).to.equal(666000);
    });
  });

  describe("Permission Management", function () {
    it("should set permissions for all stored values", async function () {
      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(10);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(20);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(30000);
      const encrypted3 = input3.encrypt();

      // Store values - permissions are automatically set
      const tx = await contract.encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      await expect(tx).to.not.be.reverted;

      // Verify all values are accessible
      const storedData = await contract.getStoredValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(10);
      expect(dec2).to.equal(20);
      expect(dec3).to.equal(30000);
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero values", async function () {
      const { fhevm } = hre as any;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(0);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(0);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(0);
      const encrypted3 = input3.encrypt();

      await contract.encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      const storedData = await contract.getStoredValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(0);
      expect(dec2).to.equal(0);
      expect(dec3).to.equal(0);
    });

    it("should handle maximum values", async function () {
      const { fhevm } = hre as any;

      const maxUint32 = 2n ** 32n - 1n;
      const maxUint64 = 2n ** 64n - 1n;

      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(maxUint32);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(maxUint32);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(maxUint64);
      const encrypted3 = input3.encrypt();

      await contract.encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      const storedData = await contract.getStoredValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(maxUint32);
      expect(dec2).to.equal(maxUint32);
      expect(dec3).to.equal(maxUint64);
    });

    it("should handle sequential stores", async function () {
      const { fhevm } = hre as any;
      const testAddress = otherAccount.address;

      // First store
      const input1a = fhevm.createEncryptedInput(await contract.getAddress(), testAddress);
      input1a.add32(11);
      const encrypted1a = input1a.encrypt();

      const input2a = fhevm.createEncryptedInput(await contract.getAddress(), testAddress);
      input2a.add32(22);
      const encrypted2a = input2a.encrypt();

      const input3a = fhevm.createEncryptedInput(await contract.getAddress(), testAddress);
      input3a.add64(33000);
      const encrypted3a = input3a.encrypt();

      await contract.connect(otherAccount).encryptAndStore(
        encrypted1a.data,
        encrypted1a.proof,
        encrypted2a.data,
        encrypted2a.proof,
        encrypted3a.data,
        encrypted3a.proof
      );

      // Second store (should overwrite)
      const input1b = fhevm.createEncryptedInput(await contract.getAddress(), testAddress);
      input1b.add32(99);
      const encrypted1b = input1b.encrypt();

      const input2b = fhevm.createEncryptedInput(await contract.getAddress(), testAddress);
      input2b.add32(88);
      const encrypted2b = input2b.encrypt();

      const input3b = fhevm.createEncryptedInput(await contract.getAddress(), testAddress);
      input3b.add64(77000);
      const encrypted3b = input3b.encrypt();

      await contract.connect(otherAccount).encryptAndStore(
        encrypted1b.data,
        encrypted1b.proof,
        encrypted2b.data,
        encrypted2b.proof,
        encrypted3b.data,
        encrypted3b.proof
      );

      // Verify latest values
      const storedData = await contract.getStoredValues(testAddress);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(99);
      expect(dec2).to.equal(88);
      expect(dec3).to.equal(77000);
    });
  });

  describe("Integration", function () {
    it("should complete full encryption workflow", async function () {
      const { fhevm } = hre as any;

      // Create and store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(256);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(512);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(1024000);
      const encrypted3 = input3.encrypt();

      const tx = await contract.encryptAndStore(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Verify transaction
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Verify storage
      const storedData = await contract.getStoredValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(storedData.value1);
      const dec2 = await fhevm.userDecryptEuint32(storedData.value2);
      const dec3 = await fhevm.userDecryptEuint64(storedData.value3);

      expect(dec1).to.equal(256);
      expect(dec2).to.equal(512);
      expect(dec3).to.equal(1024000);
    });
  });
});
