// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITimeHolder} from "./interface/ITimeHolder.sol";
import {Gov} from "./base/Gov.sol";
import {AssetLocker} from "./AssetLocker.sol";

contract TimeHolder is ITimeHolder, Gov {
  function name()
  external pure virtual override
  returns (string memory) {
    return "TimeHolder";
  }

  function version()
  external pure virtual override
  returns (string memory) {
    return "1.2.0";
  }

  error LockerHasBeenUnlocked(address payable locker);

  uint256 private _amountPerSecond;

  function initialize(address initialGovToken, uint256 initialAmountPerSecond)
  public initializer {
    Gov.initialize(initialGovToken);
    _setAmountPerSecond(initialAmountPerSecond);
  }

  function setAmountPerSecond(uint256 amount)
  external
  onlyOwner {
    _setAmountPerSecond(amount);
  }

  function _setAmountPerSecond(uint256 amount)
  internal {
    _amountPerSecond = amount;
    emit SetAmountPerSecond(amount);
  }

  function getAmountPerSecond()
  public view
  returns (uint256) {
    return _amountPerSecond;
  }

  function unlock(address payable locker)
  external {
    uint256 amount = getAmountForUnlock(locker);
    if (amount == 0) revert LockerHasBeenUnlocked(locker);
    IERC20(govToken()).transferFrom(msg.sender, address(this), amount);
    AssetLocker(locker).unlock();
  }

  function getAmountForUnlock(address payable locker)
  public view
  returns (uint256) {
    uint256 unlockTime = AssetLocker(locker).unlockTime();
    if (unlockTime <= block.timestamp) return 0;
    return (unlockTime - block.timestamp) * getAmountPerSecond();
  }

  function shortenUnlockTime(address payable locker, uint256 shortenedTime)
  external {
    uint256 amount = getAmountForShortenUnlockTime(locker, shortenedTime);
    if (amount == 0) revert LockerHasBeenUnlocked(locker);
    IERC20(govToken()).transferFrom(msg.sender, address(this), amount);
    AssetLocker(locker).shortenUnlockTime(shortenedTime);
  }

  function getAmountForShortenUnlockTime(address payable locker, uint256 shortenedTime)
  public view
  returns (uint256) {
    uint256 unlockTime = AssetLocker(locker).unlockTime();
    if (unlockTime <= block.timestamp) return 0;
    uint256 lockTime = unlockTime - block.timestamp;
    if (lockTime < shortenedTime) shortenedTime = lockTime;
    return shortenedTime * getAmountPerSecond();
  }

  function transferGuardianship(address payable locker, address newGuardian)
  external
  onlyOwner {
    AssetLocker(locker).transferGuardianship(newGuardian);
  }
}
