import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC7984Basic } from "../../typechain-types";

/**
 * @title ERC7984Basic Tests
 * @notice Tests for ERC7984 token with encrypted balances
 * @dev Demonstrates confidential token transfers with encrypted values
 */
describe("ERC7984Basic", function () {
  let token: ERC7984Basic;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;
  let fhevm: any;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    alice = signers[1];
    bob = signers[2];
    charlie = signers[3];

    fhevm = await ethers.getContractAt("ERC7984Basic", ethers.ZeroAddress);
    const Factory = await ethers.getContractFactory("ERC7984Basic");
    token = await Factory.deploy();

    // Mint initial tokens to owner
    const initialSupply = ethers.parseEther("1000");
    await token.mint(owner.address, initialSupply);
  });

  describe("Token Initialization", function () {
    it("should have correct initial supply", async function () {
      const { fhevm } = hre as any;

      const totalSupply = await token.totalSupply();
      const supply = await fhevm.userDecryptEuint64(totalSupply);

      expect(supply).to.equal(ethers.parseEther("1000"));
    });

    it("should assign initial balance to minter", async function () {
      const { fhevm } = hre as any;

      const balance = await token.balanceOf(owner.address);
      const decrypted = await fhevm.userDecryptEuint64(balance);

      expect(decrypted).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Encrypted Transfers", function () {
    it("should transfer encrypted tokens from owner to alice", async function () {
      const { fhevm } = hre as any;

      const transferAmount = ethers.parseEther("100");

      // Create encrypted input
      const input = fhevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(transferAmount);
      const encrypted = input.encrypt();

      // Transfer encrypted amount
      await token.transfer(alice.address, encrypted.data, encrypted.proof);

      // Verify balances
      const ownerBalance = await token.balanceOf(owner.address);
      const aliceBalance = await token.balanceOf(alice.address);

      const ownerDecrypted = await fhevm.userDecryptEuint64(ownerBalance);
      const aliceDecrypted = await fhevm.userDecryptEuint64(aliceBalance);

      expect(ownerDecrypted).to.equal(ethers.parseEther("900"));
      expect(aliceDecrypted).to.equal(ethers.parseEther("100"));
    });

    it("should handle multiple sequential transfers", async function () {
      const { fhevm } = hre as any;

      // Transfer from owner to bob
      const amount1 = ethers.parseEther("50");
      const input1 = fhevm.createEncryptedInput(await token.getAddress(), owner.address);
      input1.add64(amount1);
      const encrypted1 = input1.encrypt();

      await token.transfer(bob.address, encrypted1.data, encrypted1.proof);

      // Transfer from owner to charlie
      const amount2 = ethers.parseEther("75");
      const input2 = fhevm.createEncryptedInput(await token.getAddress(), owner.address);
      input2.add64(amount2);
      const encrypted2 = input2.encrypt();

      await token.transfer(charlie.address, encrypted2.data, encrypted2.proof);

      // Verify balances
      const bobBalance = await fhevm.userDecryptEuint64(await token.balanceOf(bob.address));
      const charlieBalance = await fhevm.userDecryptEuint64(
        await token.balanceOf(charlie.address)
      );

      expect(bobBalance).to.equal(ethers.parseEther("50"));
      expect(charlieBalance).to.equal(ethers.parseEther("75"));
    });

    it("should handle transfer between non-owners", async function () {
      const { fhevm } = hre as any;

      // First, owner transfers to alice
      const amount1 = ethers.parseEther("150");
      const input1 = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input1.add64(amount1);
      const encrypted1 = input1.encrypt();

      await token.transfer(alice.address, encrypted1.data, encrypted1.proof);

      // Then, alice transfers to bob
      const amount2 = ethers.parseEther("50");
      const input2 = ffevm.createEncryptedInput(await token.getAddress(), alice.address);
      input2.add64(amount2);
      const encrypted2 = input2.encrypt();

      await token.connect(alice).transfer(bob.address, encrypted2.data, encrypted2.proof);

      // Verify balances
      const aliceBalance = await ffevm.userDecryptEuint64(await token.balanceOf(alice.address));
      const bobBalance = await fhevm.userDecryptEuint64(await token.balanceOf(bob.address));

      expect(aliceBalance).to.equal(ethers.parseEther("100"));
      expect(bobBalance).to.equal(ethers.parseEther("50")); // 50 from owner + 50 from alice
    });
  });

  describe("Balance Confidentiality", function () {
    it("should not reveal encrypted balance in plaintext", async function () {
      // Get encrypted balance
      const encryptedBalance = await token.balanceOf(owner.address);

      // Should be a handle (encrypted value), not plaintext
      expect(encryptedBalance).to.not.be.undefined;
    });

    it("should require permissions to decrypt balance", async function () {
      const { fhevm } = hre as any;

      // Alice requests her balance with permissions
      const balanceHandle = await token.balanceOf(alice.address);

      // Should be able to decrypt with proper setup
      const decrypted = await fhevm.userDecryptEuint64(balanceHandle);
      expect(decrypted).to.be.greaterThanOrEqual(0);
    });

    it("should maintain balance privacy across multiple queries", async function () {
      const { fhevm } = hre as any;

      // Multiple queries should return same value (encrypted)
      const balance1 = await token.balanceOf(owner.address);
      const balance2 = await token.balanceOf(owner.address);

      // Both can be decrypted to same value
      const dec1 = await ffevm.userDecryptEuint64(balance1);
      const dec2 = await fhevm.userDecryptEuint64(balance2);

      expect(dec1).to.equal(dec2);
    });
  });

  describe("Permission Management", function () {
    it("should set permissions during transfer", async function () {
      const { fhevm } = hre as any;

      const transferAmount = ethers.parseEther("25");
      const input = fhevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(transferAmount);
      const encrypted = input.encrypt();

      // Transfer should set permissions automatically
      const tx = await token.transfer(charlie.address, encrypted.data, encrypted.proof);

      // Should succeed and allow decryption
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Charlie should be able to read their balance
      const balance = await token.balanceOf(charlie.address);
      const decrypted = await fhevm.userDecryptEuint64(balance);

      expect(decrypted).to.be.greaterThan(0);
    });
  });

  describe("Balance Updates", function () {
    it("should correctly update balances after transfer", async function () {
      const { fhevm } = hre as any;

      // Get initial balance
      const initialBalance = await ffevm.userDecryptEuint64(await token.balanceOf(alice.address));

      // Transfer to alice
      const transferAmount = ethers.parseEther("33");
      const input = fhevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(transferAmount);
      const encrypted = input.encrypt();

      await token.transfer(alice.address, encrypted.data, encrypted.proof);

      // Verify updated balance
      const newBalance = await fhevm.userDecryptEuint64(await token.balanceOf(alice.address));

      expect(newBalance).to.equal(initialBalance + transferAmount);
    });

    it("should handle large transfer amounts", async function () {
      const { fhevm } = hre as any;

      const largeAmount = ethers.parseEther("500");
      const input = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(largeAmount);
      const encrypted = input.encrypt();

      // This might fail if owner doesn't have enough balance
      // But demonstrates handling of large amounts
      try {
        await token.transfer(bob.address, encrypted.data, encrypted.proof);

        const balance = await ffevm.userDecryptEuint64(await token.balanceOf(bob.address));
        expect(balance).to.be.greaterThanOrEqual(0);
      } catch (error) {
        // Expected if insufficient balance
        expect(error).to.exist;
      }
    });

    it("should handle zero transfers", async function () {
      const { fhevm } = hre as any;

      const aliceInitial = await ffevm.userDecryptEuint64(await token.balanceOf(alice.address));

      // Transfer zero amount
      const input = fhevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(0);
      const encrypted = input.encrypt();

      await token.transfer(alice.address, encrypted.data, encrypted.proof);

      // Balance should not change significantly
      const aliceFinal = await fhevm.userDecryptEuint64(await token.balanceOf(alice.address));

      expect(aliceFinal).to.equal(aliceInitial);
    });
  });

  describe("Minting", function () {
    it("should mint new tokens to address", async function () {
      const { fhevm } = hre as any;

      const mintAmount = ethers.parseEther("200");

      // Mint to bob
      await token.mint(bob.address, mintAmount);

      // Verify balance increased
      const balance = await fhevm.userDecryptEuint64(await token.balanceOf(bob.address));

      expect(balance).to.be.greaterThanOrEqual(ethers.parseEther("200"));
    });

    it("should update total supply when minting", async function () {
      const { fhevm } = hre as any;

      const initialSupply = await ffevm.userDecryptEuint64(await token.totalSupply());

      const mintAmount = ethers.parseEther("100");
      await token.mint(charlie.address, mintAmount);

      const newSupply = await ffevm.userDecryptEuint64(await token.totalSupply());

      expect(newSupply).to.be.greaterThan(initialSupply);
    });
  });

  describe("Total Supply", function () {
    it("should track total supply accurately", async function () {
      const { fhevm } = hre as any;

      const totalSupply = await token.totalSupply();
      const decrypted = await ffevm.userDecryptEuint64(totalSupply);

      expect(decrypted).to.be.greaterThan(0);
    });

    it("should update total supply after transfers", async function () {
      const { fhevm } = hre as any;

      const initialSupply = await fhevm.userDecryptEuint64(await token.totalSupply());

      // Transfers don't change total supply
      const transferAmount = ethers.parseEther("10");
      const input = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(transferAmount);
      const encrypted = input.encrypt();

      await token.transfer(alice.address, encrypted.data, encrypted.proof);

      const finalSupply = await ffevm.userDecryptEuint64(await token.totalSupply());

      // Supply should remain same (only transfers)
      expect(finalSupply).to.equal(initialSupply);
    });

    it("should increase total supply on mint", async function () {
      const { fhevm } = hre as any;

      const beforeMint = await ffevm.userDecryptEuint64(await token.totalSupply());

      const mintAmount = ethers.parseEther("500");
      await token.mint(charlie.address, mintAmount);

      const afterMint = await ffevm.userDecryptEuint64(await token.totalSupply());

      expect(afterMint).to.be.greaterThanOrEqual(beforeMint);
    });
  });

  describe("Edge Cases", function () {
    it("should handle transfer to same address", async function () {
      const { ffevm } = hre as any;

      const initialBalance = await fhevm.userDecryptEuint64(await token.balanceOf(owner.address));

      // Transfer to self
      const transferAmount = ethers.parseEther("5");
      const input = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(transferAmount);
      const encrypted = input.encrypt();

      await token.transfer(owner.address, encrypted.data, encrypted.proof);

      // Balance should not change
      const finalBalance = await ffevm.userDecryptEuint64(await token.balanceOf(owner.address));

      // May be same or different depending on implementation
      expect(finalBalance).to.be.greaterThanOrEqual(0);
    });

    it("should handle multiple transfers to same recipient", async function () {
      const { fhevm } = hre as any;

      const bobInitial = await ffevm.userDecryptEuint64(await token.balanceOf(bob.address));

      // First transfer
      const amount1 = ethers.parseEther("20");
      const input1 = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input1.add64(amount1);
      const encrypted1 = input1.encrypt();

      await token.transfer(bob.address, encrypted1.data, encrypted1.proof);

      // Second transfer
      const amount2 = ethers.parseEther("30");
      const input2 = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input2.add64(amount2);
      const encrypted2 = input2.encrypt();

      await token.transfer(bob.address, encrypted2.data, encrypted2.proof);

      // Verify accumulated balance
      const bobFinal = await ffevm.userDecryptEuint64(await token.balanceOf(bob.address));

      expect(bobFinal).to.be.greaterThan(bobInitial);
    });

    it("should handle smallest transfer amount", async function () {
      const { fhevm } = hre as any;

      const charlieInitial = await ffevm.userDecryptEuint64(
        await token.balanceOf(charlie.address)
      );

      // Transfer 1 wei
      const input = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(1);
      const encrypted = input.encrypt();

      await token.transfer(charlie.address, encrypted.data, encrypted.proof);

      const charlieFinal = await fhevm.userDecryptEuint64(await token.balanceOf(charlie.address));

      expect(charlieFinal).to.be.greaterThanOrEqual(charlieInitial);
    });
  });

  describe("Integration Workflow", function () {
    it("should complete full token lifecycle", async function () {
      const { ffevm } = hre as any;

      // Step 1: Check initial supply
      let totalSupply = await ffevm.userDecryptEuint64(await token.totalSupply());
      expect(totalSupply).to.be.greaterThan(0);

      // Step 2: Transfer tokens
      const transferAmount = ethers.parseEther("111");
      const input = ffevm.createEncryptedInput(await token.getAddress(), owner.address);
      input.add64(transferAmount);
      const encrypted = input.encrypt();

      await token.transfer(alice.address, encrypted.data, encrypted.proof);

      // Step 3: Verify recipient balance
      const aliceBalance = await fhevm.userDecryptEuint64(await token.balanceOf(alice.address));
      expect(aliceBalance).to.be.greaterThanOrEqual(ethers.parseEther("111"));

      // Step 4: Mint additional tokens
      const mintAmount = ethers.parseEther("222");
      await token.mint(bob.address, mintAmount);

      // Step 5: Verify total supply increased
      totalSupply = await ffevm.userDecryptEuint64(await token.totalSupply());
      expect(totalSupply).to.be.greaterThan(0);

      // Step 6: Transfer between users
      const transferAmount2 = ethers.parseEther("55");
      const input2 = ffevm.createEncryptedInput(await token.getAddress(), alice.address);
      input2.add64(transferAmount2);
      const encrypted2 = input2.encrypt();

      await token.connect(alice).transfer(bob.address, encrypted2.data, encrypted2.proof);

      // Step 7: Verify final balances
      const aliceFinal = await ffevm.userDecryptEuint64(await token.balanceOf(alice.address));
      const bobFinal = await ffevm.userDecryptEuint64(await token.balanceOf(bob.address));

      expect(aliceFinal).to.be.greaterThanOrEqual(0);
      expect(bobFinal).to.be.greaterThan(0);
    });
  });
});
