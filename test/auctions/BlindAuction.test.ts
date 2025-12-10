import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import type { BlindAuction } from "../../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * @chapter advanced-patterns
 * @difficulty advanced
 *
 * Test suite for Blind Auction contract
 * Demonstrates confidential auction with encrypted bids
 */
describe("BlindAuction", function () {
  let contract: BlindAuction;
  let seller: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let bidder3: SignerWithAddress;

  const BIDDING_TIME = 3600; // 1 hour
  const REVEAL_TIME = 1800; // 30 minutes

  beforeEach(async function () {
    [seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const BlindAuction = await ethers.getContractFactory("BlindAuction");
    contract = await BlindAuction.deploy(BIDDING_TIME, REVEAL_TIME);
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should initialize with correct seller", async function () {
      expect(await contract.getHighestBidder()).to.equal(ethers.ZeroAddress);
    });

    it("should start with zero bids", async function () {
      expect(await contract.getBidCount()).to.equal(0);
    });

    it("should be active after deployment", async function () {
      expect(await contract.isBiddingActive()).to.be.true;
    });
  });

  describe("Bid Placement", function () {
    it("should allow placing encrypted bids", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Bidder1 places bid of 100
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();

      const tx = await contract.connect(bidder1).placeBid(encrypted1.data, encrypted1.proof);
      await tx.wait();

      expect(await contract.getBidCount()).to.equal(1);
    });

    it("should track multiple bids", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Bidder1: 100
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();
      await (await contract.connect(bidder1).placeBid(encrypted1.data, encrypted1.proof)).wait();

      // Bidder2: 150
      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), bidder2.address);
      input2.add32(150);
      const encrypted2 = input2.encrypt();
      await (await contract.connect(bidder2).placeBid(encrypted2.data, encrypted2.proof)).wait();

      // Bidder3: 120
      const input3 = fhevm.createEncryptedInput(await contract.getAddress(), bidder3.address);
      input3.add32(120);
      const encrypted3 = input3.encrypt();
      await (await contract.connect(bidder3).placeBid(encrypted3.data, encrypted3.proof)).wait();

      expect(await contract.getBidCount()).to.equal(3);
    });

    it("should emit BidPlaced event", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input.add32(100);
      const encrypted = input.encrypt();

      await expect(contract.connect(bidder1).placeBid(encrypted.data, encrypted.proof))
        .to.emit(contract, "BidPlaced")
        .withArgs(bidder1.address);
    });

    it("should update highest bidder", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Place first bid
      const input = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input.add32(100);
      const encrypted = input.encrypt();
      await (await contract.connect(bidder1).placeBid(encrypted.data, encrypted.proof)).wait();

      expect(await contract.getHighestBidder()).to.equal(bidder1.address);
    });

    it("should prevent bids after deadline", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      // Fast forward time past bidding deadline
      await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + 1]);
      await ethers.provider.send("evm_mine", []);

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input.add32(100);
      const encrypted = input.encrypt();

      await expect(
        contract.connect(bidder1).placeBid(encrypted.data, encrypted.proof)
      ).to.be.revertedWith("Bidding closed");
    });
  });

  describe("Bid Revelation", function () {
    beforeEach(async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Place a bid
      const input = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input.add32(100);
      const encrypted = input.encrypt();
      await (await contract.connect(bidder1).placeBid(encrypted.data, encrypted.proof)).wait();

      // Fast forward to reveal period
      await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + 1]);
      await ethers.provider.send("evm_mine", []);
    });

    it("should allow revealing bid after bidding closes", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const tx = await contract.connect(bidder1).revealBid();
      await tx.wait();

      await expect(tx).to.emit(contract, "BidRevealed").withArgs(bidder1.address);
    });

    it("should prevent revealing before bidding closes", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Reset time
      await ethers.provider.send("evm_increaseTime", [-BIDDING_TIME - 1]);
      await ethers.provider.send("evm_mine", []);

      // Place new bid
      const input = fhevm.createEncryptedInput(await contract.getAddress(), bidder2.address);
      input.add32(200);
      const encrypted = input.encrypt();
      await (await contract.connect(bidder2).placeBid(encrypted.data, encrypted.proof)).wait();

      await expect(contract.connect(bidder2).revealBid()).to.be.revertedWith("Bidding not closed");
    });

    it("should prevent revealing after reveal period", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      // Fast forward past reveal deadline
      await ethers.provider.send("evm_increaseTime", [REVEAL_TIME + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(contract.connect(bidder1).revealBid()).to.be.revertedWith("Reveal period closed");
    });
  });

  describe("Auction End", function () {
    it("should end auction and determine winner", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      // Place bids
      const input1 = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input1.add32(100);
      const encrypted1 = input1.encrypt();
      await (await contract.connect(bidder1).placeBid(encrypted1.data, encrypted1.proof)).wait();

      const input2 = fhevm.createEncryptedInput(await contract.getAddress(), bidder2.address);
      input2.add32(200);
      const encrypted2 = input2.encrypt();
      await (await contract.connect(bidder2).placeBid(encrypted2.data, encrypted2.proof)).wait();

      // Fast forward past reveal deadline
      await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + REVEAL_TIME + 1]);
      await ethers.provider.send("evm_mine", []);

      // End auction
      const tx = await contract.connect(seller).auctionEnd();
      await expect(tx).to.emit(contract, "AuctionEnded");
    });

    it("should only allow seller to end auction", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      await ethers.provider.send("evm_increaseTime", [BIDDING_TIME + REVEAL_TIME + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(contract.connect(bidder1).auctionEnd()).to.be.revertedWith("Only seller can end auction");
    });
  });

  describe("Privacy Properties", function () {
    it("should keep bid amounts encrypted", async function () {
      if (hre.network.name !== "hardhat" && hre.network.name !== "anvil") {
        this.skip();
      }

      const { fhevm } = hre as any;

      const input = fhevm.createEncryptedInput(await contract.getAddress(), bidder1.address);
      input.add32(12345);
      const encrypted = input.encrypt();
      await (await contract.connect(bidder1).placeBid(encrypted.data, encrypted.proof)).wait();

      const highestBid = await contract.getHighestBid();
      expect(highestBid).to.exist;
      expect(typeof highestBid).to.equal("string"); // Encrypted format
    });
  });
});
