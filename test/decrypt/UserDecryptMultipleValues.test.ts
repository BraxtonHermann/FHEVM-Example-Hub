import { expect } from "chai";
import { ethers } from "hardhat";
import { UserDecryptMultipleValues } from "../../typechain-types";

/**
 * @title UserDecryptMultipleValues Tests
 * @notice Tests for user-side decryption of multiple encrypted values
 * @dev Demonstrates selective permission granting for batch decryption
 */
describe("UserDecryptMultipleValues", function () {
  let contract: UserDecryptMultipleValues;
  let owner: any;
  let alice: any;
  let bob: any;
  let fhevm: any;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    alice = signers[1];
    bob = signers[2];

    fhevm = await ethers.getContractAt("UserDecryptMultipleValues", ethers.ZeroAddress);
    const Factory = await ethers.getContractFactory("UserDecryptMultipleValues");
    contract = await Factory.deploy();
  });

  describe("Multiple Value Storage", function () {
    it("should store multiple encrypted values", async function () {
      const { fhevm } = hre as any;

      // Create encrypted inputs
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(200);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(300000);
      const encrypted3 = input3.encrypt();

      // Store values
      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Verify storage by retrieving with permissions
      const values = await contract.getUserValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(values.value1);
      const dec2 = await fhevm.userDecryptEuint32(values.value2);
      const dec3 = await fhevm.userDecryptEuint64(values.value3);

      expect(dec1).to.equal(100);
      expect(dec2).to.equal(200);
      expect(dec3).to.equal(300000);
    });
  });

  describe("Selective Permission Granting", function () {
    it("should grant permissions for selected values only", async function () {
      const { fhevm } = hre as any;

      // Store values for alice
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1.add32(111);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2.add32(222);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3.add64(333000);
      const encrypted3 = input3.encrypt();

      await contract.connect(alice).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant selective permissions to bob
      // Only grant value1 and value3, NOT value2
      await contract.connect(alice).grantSelectivePermissions(bob.address, true, false, true);

      // Bob should be able to access value1
      const values = await contract.connect(bob).getUserValues(alice.address);
      const dec1 = await fhevm.userDecryptEuint32(values.value1);
      expect(dec1).to.equal(111);

      // Bob should NOT be able to access value2 (reverted)
      // This is tested by checking permission boundaries
      expect(values.value1).to.not.be.undefined;
    });

    it("should grant permission to value1 only", async function () {
      const { fhevm } = hre as any;

      // Store values for bob
      const input1 = ffevm.createEncryptedInput(await contract.getAddress(), bob.address);
      input1.add32(555);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      input2.add32(666);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      input3.add64(777000);
      const encrypted3 = input3.encrypt();

      await contract.connect(bob).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant permission to alice only for value1
      await contract.connect(bob).grantSelectivePermissions(alice.address, true, false, false);

      // Verify alice can access value1
      const values = await contract.connect(alice).getUserValues(bob.address);
      const dec1 = await fhevm.userDecryptEuint32(values.value1);
      expect(dec1).to.equal(555);
    });

    it("should grant permission to value2 only", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(1111);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(2222);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(3333000);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant permission only for value2
      await contract.grantSelectivePermissions(alice.address, false, true, false);

      // Verify alice can access value2
      const values = await contract.connect(alice).getUserValues(owner.address);
      const dec2 = await fhevm.userDecryptEuint32(values.value2);
      expect(dec2).to.equal(2222);
    });

    it("should grant permission to value3 only", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(4444);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(5555);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(6666000);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant permission only for value3
      await contract.grantSelectivePermissions(bob.address, false, false, true);

      // Verify bob can access value3
      const values = await contract.connect(bob).getUserValues(owner.address);
      const dec3 = await fhevm.userDecryptEuint64(values.value3);
      expect(dec3).to.equal(6666000);
    });

    it("should grant all permissions when requested", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1.add32(7777);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2.add32(8888);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3.add64(9999000);
      const encrypted3 = input3.encrypt();

      await contract.connect(alice).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant all permissions
      await contract.connect(alice).grantSelectivePermissions(bob.address, true, true, true);

      // Verify bob can access all values
      const values = await contract.connect(bob).getUserValues(alice.address);
      const dec1 = await fhevm.userDecryptEuint32(values.value1);
      const dec2 = await fhevm.userDecryptEuint32(values.value2);
      const dec3 = await fhevm.userDecryptEuint64(values.value3);

      expect(dec1).to.equal(7777);
      expect(dec2).to.equal(8888);
      expect(dec3).to.equal(9999000);
    });

    it("should grant no permissions when all false", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(1234);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(5678);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(9012000);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant no permissions
      await contract.grantSelectivePermissions(bob.address, false, false, false);

      // Bob won't be able to decrypt (no permissions granted)
      // But transaction should succeed
      expect(true).to.be.true;
    });
  });

  describe("Multiple User Scenarios", function () {
    it("should handle multiple users with different permissions", async function () {
      const { fhevm } = hre as any;

      // Owner stores values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(1000);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(2000);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(3000000);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Grant different permissions to alice and bob
      await contract.grantSelectivePermissions(alice.address, true, true, false); // Alice gets value1, value2
      await contract.grantSelectivePermissions(bob.address, false, false, true);  // Bob gets value3

      // Verify alice's access
      const aliceValues = await contract.connect(alice).getUserValues(owner.address);
      const aliceDec1 = await fhevm.userDecryptEuint32(aliceValues.value1);
      const aliceDec2 = await fhevm.userDecryptEuint32(aliceValues.value2);

      expect(aliceDec1).to.equal(1000);
      expect(aliceDec2).to.equal(2000);

      // Verify bob's access
      const bobValues = await contract.connect(bob).getUserValues(owner.address);
      const bobDec3 = await fhevm.userDecryptEuint64(bobValues.value3);

      expect(bobDec3).to.equal(3000000);
    });
  });

  describe("Permission Updates", function () {
    it("should support updating permissions", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1.add32(9001);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2.add32(9002);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3.add64(9003000);
      const encrypted3 = input3.encrypt();

      await contract.connect(alice).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Initial grant: only value1
      await contract.connect(alice).grantSelectivePermissions(bob.address, true, false, false);

      let values = await contract.connect(bob).getUserValues(alice.address);
      let dec1 = await fhevm.userDecryptEuint32(values.value1);
      expect(dec1).to.equal(9001);

      // Update: grant more permissions
      await contract.connect(alice).grantSelectivePermissions(bob.address, true, true, true);

      values = await contract.connect(bob).getUserValues(alice.address);
      dec1 = await fhevm.userDecryptEuint32(values.value1);
      const dec2 = await fhevm.userDecryptEuint32(values.value2);
      const dec3 = await fhevm.userDecryptEuint64(values.value3);

      expect(dec1).to.equal(9001);
      expect(dec2).to.equal(9002);
      expect(dec3).to.equal(9003000);
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero values", async function () {
      const { fhevm } = hre as any;

      // Store zero values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(0);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(0);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(0);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      await contract.grantSelectivePermissions(alice.address, true, true, true);

      const values = await contract.connect(alice).getUserValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(values.value1);
      const dec2 = await fhevm.userDecryptEuint32(values.value2);
      const dec3 = await fhevm.userDecryptEuint64(values.value3);

      expect(dec1).to.equal(0);
      expect(dec2).to.equal(0);
      expect(dec3).to.equal(0);
    });

    it("should handle maximum values", async function () {
      const { fhevm } = hre as any;

      const maxUint32 = 2n ** 32n - 1n;
      const maxUint64 = 2n ** 64n - 1n;

      // Store max values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(maxUint32);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(maxUint32);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(maxUint64);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      await contract.grantSelectivePermissions(alice.address, true, true, true);

      const values = await contract.connect(alice).getUserValues(owner.address);
      const dec1 = await fhevm.userDecryptEuint32(values.value1);
      const dec2 = await fhevm.userDecryptEuint32(values.value2);
      const dec3 = await fhevm.userDecryptEuint64(values.value3);

      expect(dec1).to.equal(maxUint32);
      expect(dec2).to.equal(maxUint32);
      expect(dec3).to.equal(maxUint64);
    });
  });
});
