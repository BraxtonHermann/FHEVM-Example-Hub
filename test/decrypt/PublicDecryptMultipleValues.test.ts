import { expect } from "chai";
import { ethers } from "hardhat";
import { PublicDecryptMultipleValues } from "../../typechain-types";

/**
 * @title PublicDecryptMultipleValues Tests
 * @notice Tests for batch public decryption via relayer pattern
 * @dev Demonstrates decrypting multiple encrypted values to plaintext on-chain
 */
describe("PublicDecryptMultipleValues", function () {
  let contract: PublicDecryptMultipleValues;
  let owner: any;
  let alice: any;
  let bob: any;
  let relayer: any;
  let fhevm: any;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    alice = signers[1];
    bob = signers[2];
    relayer = signers[3];

    fhevm = await ethers.getContractAt("PublicDecryptMultipleValues", ethers.ZeroAddress);
    const Factory = await ethers.getContractFactory("PublicDecryptMultipleValues");
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

      // Store multiple encrypted values
      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Verify values are stored (still encrypted)
      expect(await contract.allDecrypted()).to.be.false;
    });

    it("should overwrite previously stored values", async function () {
      const { fhevm } = hre as any;

      // First storage
      const input1a = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1a.add32(10);
      const encrypted1a = input1a.encrypt();

      const input2a = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2a.add32(20);
      const encrypted2a = input2a.encrypt();

      const input3a = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3a.add64(30000);
      const encrypted3a = input3a.encrypt();

      await contract.connect(alice).storeMultipleValues(
        encrypted1a.data,
        encrypted1a.proof,
        encrypted2a.data,
        encrypted2a.proof,
        encrypted3a.data,
        encrypted3a.proof
      );

      // Second storage (overwrite)
      const input1b = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1b.add32(110);
      const encrypted1b = input1b.encrypt();

      const input2b = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2b.add32(120);
      const encrypted2b = input2b.encrypt();

      const input3b = ffevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3b.add64(130000);
      const encrypted3b = input3b.encrypt();

      await contract.connect(alice).storeMultipleValues(
        encrypted1b.data,
        encrypted1b.proof,
        encrypted2b.data,
        encrypted2b.proof,
        encrypted3b.data,
        encrypted3b.proof
      );

      // Should still not be decrypted
      expect(await contract.allDecrypted()).to.be.false;
    });
  });

  describe("Decryption Requests", function () {
    it("should request decryption for all values", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(500);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(600);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(700000);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      // Request decryption
      const tx = await contract.requestDecryption();

      await expect(tx).to.emit(contract, "DecryptionRequested");
      expect(await contract.allDecrypted()).to.be.false;
    });

    it("should prevent decryption requests when already decrypted", async function () {
      const { fhevm } = hre as any;

      // Store values
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

      // Request and decrypt
      await contract.connect(alice).requestDecryption();
      await contract.decryptionCallback1(111);
      await contract.decryptionCallback2(222);
      await contract.decryptionCallback3(333000);

      // Second request should fail
      await expect(contract.connect(alice).requestDecryption()).to.be.revertedWith(
        "Already decrypted"
      );
    });
  });

  describe("Individual Relayer Callbacks", function () {
    it("should handle individual callbacks for each value", async function () {
      const { fhevm } = hre as any;

      // Store values
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

      // Request decryption
      await contract.requestDecryption();

      // Individual callbacks
      const tx1 = await contract.decryptionCallback1(1000);
      await expect(tx1).to.emit(contract, "Value1Decrypted").withArgs(1000);

      const tx2 = await contract.decryptionCallback2(2000);
      await expect(tx2).to.emit(contract, "Value2Decrypted").withArgs(2000);

      const tx3 = await contract.decryptionCallback3(3000000);
      await expect(tx3).to.emit(contract, "Value3Decrypted").withArgs(3000000);

      // All should be decrypted
      expect(await contract.allDecrypted()).to.be.true;
    });

    it("should store decrypted values correctly", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1.add32(555);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2.add32(666);
      const encrypted2 = input2.encrypt();

      const input3 = ffevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3.add64(777000);
      const encrypted3 = input3.encrypt();

      await contract.connect(alice).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      await contract.connect(alice).requestDecryption();

      // Callbacks
      await contract.decryptionCallback1(555);
      await contract.decryptionCallback2(666);
      await contract.decryptionCallback3(777000);

      // Verify values
      expect(await contract.decryptedValue1()).to.equal(555);
      expect(await contract.decryptedValue2()).to.equal(666);
      expect(await contract.decryptedValue3()).to.equal(777000);
    });

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

      await contract.requestDecryption();

      // Callbacks
      await contract.decryptionCallback1(0);
      await contract.decryptionCallback2(0);
      await contract.decryptionCallback3(0);

      expect(await contract.decryptedValue1()).to.equal(0);
      expect(await contract.decryptedValue2()).to.equal(0);
      expect(await contract.decryptedValue3()).to.equal(0);
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

      await contract.requestDecryption();

      // Callbacks
      await contract.decryptionCallback1(maxUint32);
      await contract.decryptionCallback2(maxUint32);
      await contract.decryptionCallback3(maxUint64);

      expect(await contract.decryptedValue1()).to.equal(maxUint32);
      expect(await contract.decryptedValue2()).to.equal(maxUint32);
      expect(await contract.decryptedValue3()).to.equal(maxUint64);
    });
  });

  describe("Partial Decryption", function () {
    it("should handle partial decryption (only some callbacks)", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      input1.add32(888);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), bob.address);
      input2.add32(999);
      const encrypted2 = input2.encrypt();

      const input3 = ffevm.createEncryptedInput(await contract.getAddress(), bob.address);
      input3.add64(1111000);
      const encrypted3 = input3.encrypt();

      await contract.connect(bob).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      await contract.connect(bob).requestDecryption();

      // Only callback for value 1
      await contract.decryptionCallback1(888);

      // Only value 1 should be accessible
      expect(await contract.decryptedValue1()).to.equal(888);

      // Add value 2 callback
      await contract.decryptionCallback2(999);

      expect(await contract.decryptedValue1()).to.equal(888);
      expect(await contract.decryptedValue2()).to.equal(999);

      // Finally add value 3
      await contract.decryptionCallback3(1111000);

      expect(await contract.allDecrypted()).to.be.true;
    });
  });

  describe("Public Accessibility", function () {
    it("should allow anyone to read decrypted values", async function () {
      const { fhevm } = hre as any;

      // Store values
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input1.add32(2222);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input2.add32(3333);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
      input3.add64(4444000);
      const encrypted3 = input3.encrypt();

      await contract.storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );

      await contract.requestDecryption();

      // Callbacks
      await contract.decryptionCallback1(2222);
      await contract.decryptionCallback2(3333);
      await contract.decryptionCallback3(4444000);

      // Anyone can read values
      const value1_owner = await contract.connect(owner).decryptedValue1();
      const value1_alice = await contract.connect(alice).decryptedValue1();
      const value1_bob = await contract.connect(bob).decryptedValue1();

      expect(value1_owner).to.equal(2222);
      expect(value1_alice).to.equal(2222);
      expect(value1_bob).to.equal(2222);
    });
  });

  describe("Edge Cases", function () {
    it("should handle rapid sequential storage", async function () {
      const { fhevm } = hre as any;

      const values = [
        { v1: 111, v2: 222, v3: 333000 },
        { v1: 444, v2: 555, v3: 666000 },
        { v1: 777, v2: 888, v3: 999000 },
      ];

      for (const vals of values) {
        const input1 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
        input1.add32(vals.v1);
        const encrypted1 = input1.encrypt();

        const input2 = fhevm.createEncryptedInput(await contract.getAddress(), owner.address);
        input2.add32(vals.v2);
        const encrypted2 = input2.encrypt();

        const input3 = ffevm.createEncryptedInput(await contract.getAddress(), owner.address);
        input3.add64(vals.v3);
        const encrypted3 = input3.encrypt();

        await contract.storeMultipleValues(
          encrypted1.data,
          encrypted1.proof,
          encrypted2.data,
          encrypted2.proof,
          encrypted3.data,
          encrypted3.proof
        );

        await contract.requestDecryption();

        await contract.decryptionCallback1(vals.v1);
        await contract.decryptionCallback2(vals.v2);
        await contract.decryptionCallback3(vals.v3);

        expect(await contract.allDecrypted()).to.be.true;
      }
    });
  });

  describe("Integration Workflow", function () {
    it("should complete full multi-value public decryption workflow", async function () {
      const { fhevm } = hre as any;

      // Step 1: Store multiple encrypted values
      const input1 = ffevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input1.add32(5555);
      const encrypted1 = input1.encrypt();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input2.add32(6666);
      const encrypted2 = input2.encrypt();

      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
      input3.add64(7777000);
      const encrypted3 = input3.encrypt();

      const storeTx = await contract.connect(alice).storeMultipleValues(
        encrypted1.data,
        encrypted1.proof,
        encrypted2.data,
        encrypted2.proof,
        encrypted3.data,
        encrypted3.proof
      );
      await storeTx.wait();

      // Step 2: Request decryption
      const requestTx = await contract.connect(alice).requestDecryption();
      await expect(requestTx).to.emit(contract, "DecryptionRequested");

      // Step 3: Relayer decrypts and calls callbacks
      const callback1Tx = await contract.decryptionCallback1(5555);
      await expect(callback1Tx).to.emit(contract, "Value1Decrypted").withArgs(5555);

      const callback2Tx = await contract.decryptionCallback2(6666);
      await expect(callback2Tx).to.emit(contract, "Value2Decrypted").withArgs(6666);

      const callback3Tx = await contract.decryptionCallback3(7777000);
      await expect(callback3Tx).to.emit(contract, "Value3Decrypted").withArgs(7777000);

      // Step 4: Verify all values are decrypted and public
      expect(await contract.allDecrypted()).to.be.true;
      expect(await contract.decryptedValue1()).to.equal(5555);
      expect(await contract.decryptedValue2()).to.equal(6666);
      expect(await contract.decryptedValue3()).to.equal(7777000);

      // Anyone can read
      expect(await contract.connect(bob).decryptedValue1()).to.equal(5555);
    });
  });
});
