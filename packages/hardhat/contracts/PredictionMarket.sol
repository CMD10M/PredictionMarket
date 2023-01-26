//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract Chainlink {
  function latestRoundData () public view returns (uint80, int256, uint256, uint256, uint80) {
  }
}

contract PredictionMarket {

  enum Side { Yes, No }

  //user can specify this
  int256 futureEthPrice = 1500 * 100000000;
  uint256 futureTimeStamp = 1674686732;

  bool public yeswon;
  uint256 public loserBets;
  uint256 public winnerBets;
  uint256 public gamblerBet;
  bool public resultReported = false;

  mapping(Side => uint256) public bets;
  mapping(address => mapping(Side => uint256)) public betsPerGambler;

  function placeBet(Side _side) external payable {
    require(block.timestamp < futureTimeStamp, "event over");
    bets[_side] += msg.value;
    betsPerGambler[msg.sender][_side] += msg.value;
    console.log("Bet value", msg.value);
  }

  function reportResult() external returns (bool) {
    require(block.timestamp > futureTimeStamp, "event not over");
    require(!resultReported, "result already reported");
    resultReported = true;
    if (getPrice() > futureEthPrice) {
      yeswon = true;
    } else if (futureEthPrice > getPrice()){
      yeswon = false;
    } else {}
    return yeswon;
  }

    function withdrawGain() external payable {
    require(block.timestamp > futureTimeStamp, "event not over");
    if (yeswon == true) {
      loserBets = bets[Side.No];
      winnerBets = bets[Side.Yes];
      gamblerBet = betsPerGambler[msg.sender][Side.Yes];
    } else if (yeswon == false) {
      loserBets = bets[Side.Yes];
      winnerBets = bets[Side.No];
      gamblerBet = betsPerGambler[msg.sender][Side.No];
    }
    console.log("gamblerBet", gamblerBet);
    require(gamblerBet > 0, 'no winning bets'); 
    console.log("loserBets", loserBets);
    console.log("winnerBets", winnerBets);
    uint256 gain = gamblerBet * loserBets / winnerBets + gamblerBet;
    console.log("gain", gain);
    delete betsPerGambler[msg.sender][Side.Yes];
    delete betsPerGambler[msg.sender][Side.No];
    (bool sent,) = msg.sender.call{value: gain}("");
        require(sent, "Failed to send Ether");
  }

    function getTimestamp() public view returns (uint) {
      return block.timestamp;
    }

  function getPrice() public view returns (int256) {
    Chainlink chainlink = Chainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
    int256 answer;
    (, answer ,,,) = chainlink.latestRoundData();
    return answer;
  }
}