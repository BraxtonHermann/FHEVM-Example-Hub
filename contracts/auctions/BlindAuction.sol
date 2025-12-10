// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Blind Auction
/// @notice Confidential auction where bids remain encrypted during bidding
/// @dev Demonstrates complex FHE operations: comparison, selection, and conditional logic
contract BlindAuction is ZamaEthereumConfig {
  address private _seller;
  uint256 private _bidDeadline;
  uint256 private _revealDeadline;

  struct Bid {
    address bidder;
    euint32 amount;
    bool revealed;
  }

  Bid[] private _bids;
  euint32 private _highestBid;
  address private _highestBidder;

  mapping(address => euint32) private _refunds;

  event BidPlaced(address indexed bidder);
  event BidRevealed(address indexed bidder);
  event AuctionEnded(address indexed winner, uint256 amount);

  constructor(uint256 biddingTime, uint256 revealTime) {
    _seller = msg.sender;
    _bidDeadline = block.timestamp + biddingTime;
    _revealDeadline = _bidDeadline + revealTime;
    _highestBid = FHE.asEuint32(0);
  }

  /// @notice Place a sealed bid
  /// @dev Bid amount remains encrypted throughout the auction
  /// @param encryptedBid Encrypted bid amount in external format
  /// @param proof Zero-knowledge proof of valid encryption
  function placeBid(externalEuint32 encryptedBid, bytes calldata proof) external {
    require(block.timestamp <= _bidDeadline, "Bidding closed");

    euint32 bid = FHE.fromExternal(encryptedBid, proof);

    // Update highest bid if this bid is higher
    ebool isHigher = FHE.ge(bid, _highestBid);
    euint32 newHighest = FHE.select(isHigher, bid, _highestBid);

    _highestBid = newHighest;
    _highestBidder = msg.sender;

    // Store bid
    Bid memory newBid;
    newBid.bidder = msg.sender;
    newBid.amount = bid;
    newBid.revealed = false;
    _bids.push(newBid);

    FHE.allowThis(bid);
    FHE.allow(bid, msg.sender);
    FHE.allow(bid, _seller);

    emit BidPlaced(msg.sender);
  }

  /// @notice Reveal your bid after bidding closes
  /// @dev Marks bid as revealed for auction finalization
  function revealBid() external {
    require(block.timestamp > _bidDeadline, "Bidding not closed");
    require(block.timestamp <= _revealDeadline, "Reveal period closed");

    for (uint256 i = 0; i < _bids.length; i++) {
      if (_bids[i].bidder == msg.sender && !_bids[i].revealed) {
        _bids[i].revealed = true;
        emit BidRevealed(msg.sender);
        return;
      }
    }

    revert("No bid found");
  }

  /// @notice End auction and determine winner
  /// @dev Called after reveal period to finalize auction
  function auctionEnd() external {
    require(block.timestamp > _revealDeadline, "Auction not ended");
    require(msg.sender == _seller, "Only seller can end auction");

    require(_highestBidder != address(0), "No valid bids");

    emit AuctionEnded(_highestBidder, uint256(0)); // Amount stays encrypted
  }

  /// @notice Get highest encrypted bid
  /// @return Encrypted highest bid amount
  function getHighestBid() external view returns (euint32) {
    return _highestBid;
  }

  /// @notice Get highest bidder address
  /// @return Address of highest bidder
  function getHighestBidder() external view returns (address) {
    return _highestBidder;
  }

  /// @notice Get number of bids placed
  /// @return Total number of bids
  function getBidCount() external view returns (uint256) {
    return _bids.length;
  }

  /// @notice Check if auction is active
  /// @return True if bidding period is active
  function isBiddingActive() external view returns (bool) {
    return block.timestamp <= _bidDeadline;
  }
}
