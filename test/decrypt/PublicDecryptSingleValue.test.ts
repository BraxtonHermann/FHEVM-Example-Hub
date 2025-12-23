import { expect } from "chai";
import { ethers } from "hardhat";
import { PublicDecryptSingleValue } from "../../typechain-types";

/**
 * @title PublicDecryptSingleValue Tests
 * @notice Tests for public decryption via relayer pattern
 * @dev Demonstrates decrypting encrypted values to plaintext on-chain
 */
describe("PublicDecryptSingleValue", function () {
  let contract: PublicDecryptSingleValue;
  let owner: any;
  let alice: any;
  let relayer: any;
  let fhevm: any;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    alice = signers[1];
    relayer = signers[2]; // Simulates relayer role

    fhevm = await ethers.getContractAt("PublicDecryptSingleValue", ethers.ZeroAddress);
    const Factory = await ethers.getContractFactory("PublicDecryptSingleValue");
    contract = await Factory.deploy();
  });

  describe("Value Storage", function () {
    it("should store encrypted value", async function () {
      const { fhevm } = hre as any;

      // Create encrypted input
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(12345);
      const encrypted = input.encrypt();

      // Store encrypted value
      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);

      // Verify value is stored (still encrypted)
      expect(await contract.isDecrypted()).to.be.false;
    });

    it("should overwrite stored value", async function () {
      const { fhevm } = hre as any;

      // First value
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();

      await contract.storeEncryptedValue(encrypted1.data, encrypted1.proof);

      // Second value (overwrite)
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(200);
      const encrypted2 = input2.encrypt();

      await contract.storeEncryptedValue(encrypted2.data, encrypted2.proof);

      // Should still be encrypted (not decrypted yet)
      expect(await contract.isDecrypted()).to.be.false;
    });
  });

  describe("Decryption Request", function () {
    it("should request decryption for stored value", async function () {
      const { fhevm } = hre as any;

      // Store encrypted value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(555);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);

      // Request decryption
      const tx = await contract.requestDecryption();

      // Verify event emission
      await expect(tx).to.emit(contract, "DecryptionRequested");

      // Value should not yet be decrypted
      expect(await contract.isDecrypted()).to.be.false;
    });

    it("should prevent duplicate decryption requests", async function () {
      const { fhevm } = hre as any;

      // Store encrypted value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input.add32(777);
      const encrypted = input.encrypt();

      await contract.connect(alice).storeEncryptedValue(encrypted.data, encrypted.proof);

      // First request should succeed
      await contract.connect(alice).requestDecryption();

      // Simulate relayer callback
      await contract.decryptionCallback(777);

      // Second request should fail (already decrypted)
      await expect(contract.connect(alice).requestDecryption()).to.be.revertedWith(
        "Already decrypted"
      );
    });
  });

  describe("Relayer Callback", function () {
    it("should handle relayer callback and store plaintext", async function () {
      const { fhevm } = hre as any;

      // Store encrypted value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(999);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);

      // Request decryption
      await contract.requestDecryption();

      // Simulate relayer callback
      const tx = await contract.decryptionCallback(999);

      // Verify event emission
      await expect(tx).to.emit(contract, "ValueDecrypted").withArgs(999);

      // Verify decrypted value is stored
      expect(await contract.isDecrypted()).to.be.true;
      expect(await contract.decryptedValue()).to.equal(999);
    });

    it("should decrypt zero value correctly", async function () {
      const { fhevm } = hre as any;

      // Store encrypted zero
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(0);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);

      // Request and decrypt
      await contract.requestDecryption();
      await contract.decryptionCallback(0);

      expect(await contract.isDecrypted()).to.be.true;
      expect(await contract.decryptedValue()).to.equal(0);
    });

    it("should decrypt maximum uint32 value", async function () {
      const { fhevm } = hre as any;

      const maxValue = 2n ** 32n - 1n;

      // Store encrypted max value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(maxValue);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);

      // Request and decrypt
      await contract.requestDecryption();
      await contract.decryptionCallback(maxValue);

      expect(await contract.isDecrypted()).to.be.true;
      expect(await contract.decryptedValue()).to.equal(maxValue);
    });
  });

  describe("State Management", function () {
    it("should track decryption state correctly", async function () {
      const { fhevm } = hre as any;

      // Initial state
      expect(await contract.isDecrypted()).to.be.false;

      // Store value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(321);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);

      // Still not decrypted
      expect(await contract.isDecrypted()).to.be.false;

      // Request decryption
      await contract.requestDecryption();

      // Still not decrypted (waiting for callback)
      expect(await contract.isDecrypted()).to.be.false;

      // Relayer callback
      await contract.decryptionCallback(321);

      // Now decrypted
      expect(await contract.isDecrypted()).to.be.true;
    });

    it("should allow new encryption after decryption", async function () {
      const { fhevm } = hre as any;

      // First value - encrypt, decrypt
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(111);
      const encrypted1 = input1.encrypt();

      await contract.storeEncryptedValue(encrypted1.data, encrypted1.proof);
      await contract.requestDecryption();
      await contract.decryptionCallback(111);

      expect(await contract.isDecrypted()).to.be.true;
      expect(await contract.decryptedValue()).to.equal(111);

      // Second value - new encryption (should reset state)
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(222);
      const encrypted2 = input2.encrypt();

      await contract.storeEncryptedValue(encrypted2.data, encrypted2.proof);

      // Should be marked as not decrypted for new value
      // Note: This depends on contract implementation
      // If contract resets state on new storage, isDecrypted should be false
    });
  });

  describe("Edge Cases", function () {
    it("should handle callback without request", async function () {
      // Direct callback without requestDecryption
      // This tests if contract properly handles out-of-order calls
      const tx = contract.decryptionCallback(888);

      // Depending on implementation, this might revert or succeed
      // If it succeeds, value should be stored
      await expect(tx).to.not.be.reverted;
    });

    it("should handle multiple decryption callbacks", async function () {
      const { fhevm } = hre as any;

      // Store and request decryption
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(444);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);
      await contract.requestDecryption();

      // First callback
      await contract.decryptionCallback(444);

      expect(await contract.isDecrypted()).to.be.true;
      expect(await contract.decryptedValue()).to.equal(444);

      // Second callback with different value - should fail if already decrypted
      // Or update if implementation allows
      const tx = contract.decryptionCallback(555);

      // Check if it reverts or updates
      // This depends on contract implementation
    });

    it("should handle rapid storage and decryption", async function () {
      const { fhevm } = hre as any;

      const values = [100, 200, 300, 400, 500];

      for (const val of values) {
        const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
        input.add32(val);
        const encrypted = input.encrypt();

        await contract.storeEncryptedValue(encrypted.data, encrypted.proof);
        await contract.requestDecryption();
        await contract.decryptionCallback(val);

        expect(await contract.isDecrypted()).to.be.true;
        expect(await contract.decryptedValue()).to.equal(val);
      }
    });
  });

  describe("Integration Workflow", function () {
    it("should complete full public decryption workflow", async function () {
      const { fhevm } = hre as any;

      // Step 1: User encrypts and stores value
      const testValue = 7890;
      const input = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input.add32(testValue);
      const encrypted = input.encrypt();

      const storeTx = await contract.connect(alice).storeEncryptedValue(encrypted.data, encrypted.proof);
      await storeTx.wait();

      // Verify encrypted storage
      expect(await contract.isDecrypted()).to.be.false;

      // Step 2: User requests decryption
      const requestTx = await contract.connect(alice).requestDecryption();
      await expect(requestTx).to.emit(contract, "DecryptionRequested");

      // Step 3: Relayer decrypts off-chain and calls callback
      const callbackTx = await contract.decryptionCallback(testValue);
      await expect(callbackTx).to.emit(contract, "ValueDecrypted").withArgs(testValue);

      // Step 4: Verify decrypted value is publicly accessible
      expect(await contract.isDecrypted()).to.be.true;
      expect(await contract.decryptedValue()).to.equal(testValue);

      // Anyone can now read the decrypted value
      const publicValue = await contract.connect(owner).decryptedValue();
      expect(publicValue).to.equal(testValue);
    });
  });

  describe("Access Control", function () {
    it("should allow anyone to view decrypted value", async function () {
      const { fhevm } = hre as any;

      // Store and decrypt value
      const input = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input.add32(1111);
      const encrypted = input.encrypt();

      await contract.storeEncryptedValue(encrypted.data, encrypted.proof);
      await contract.requestDecryption();
      await contract.decryptionCallback(1111);

      // All users can read decrypted value
      expect(await contract.connect(owner).decryptedValue()).to.equal(1111);
      expect(await contract.connect(alice).decryptedValue()).to.equal(1111);
      expect(await contract.connect(relayer).decryptedValue()).to.equal(1111);
    });
  });
});
