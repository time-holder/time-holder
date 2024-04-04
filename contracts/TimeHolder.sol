// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ITimeHolder} from "./interface/ITimeHolder.sol";
import {Gov} from "./base/Gov.sol";
import {AssetBox} from "@timeholder/asset-box/contracts/AssetBox.sol";
import {AssetLocker} from "@timeholder/asset-locker/contracts/AssetLocker.sol";

contract TimeHolder is ITimeHolder, Gov {
  function name()
  external pure virtual override
  returns (string memory) {
    return "TimeHolder";
  }

  function version()
  external pure virtual override
  returns (string memory) {
    return "1.3.3";
  }

  error LockerHasBeenUnlocked(address locker);

  uint256 private _creationFee;
  uint256 private _amountPerSecond;

  function initialize(address initialGovToken, uint256 initialCreationFee, uint256 initialAmountPerSecond)
  public initializer {
    Gov.initialize(initialGovToken);
    _setCreationFee(initialCreationFee);
    _setAmountPerSecond(initialAmountPerSecond);
  }

  function creationFee()
  public view
  returns (uint256) {
    return _creationFee;
  }

  function setCreationFee(uint256 fee)
  external
  onlyOwner {
    _setCreationFee(fee);
  }

  function _setCreationFee(uint256 fee)
  internal {
    _creationFee = fee;
    emit SetCreationFee(fee);
  }

  function createAssetBox(address initialOwner)
  external payable
  returns (address) {
    uint256 fee = creationFee();
    _receive(govToken(), fee);
    AssetBox box = new AssetBox(initialOwner);
    emit BoxCreated(address(box), fee);
    return address(box);
  }

  function createAssetLocker(address initialOwner, address initialGuardian, uint256 lockTime)
  external payable
  returns (address) {
    uint256 fee = creationFee();
    _receive(govToken(), fee);
    AssetLocker box = new AssetLocker(initialOwner, initialGuardian, lockTime);
    emit BoxCreated(address(box), fee);
    return address(box);
  }

  function amountPerSecond()
  public view
  returns (uint256) {
    return _amountPerSecond;
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

  function unlock(address payable locker)
  external payable {
    uint256 amount = getAmountForUnlock(locker);
    if (amount == 0) revert LockerHasBeenUnlocked(locker);
    _receive(govToken(), amount);
    AssetLocker(locker).unlock();
  }

  function getAmountForUnlock(address payable locker)
  public view
  returns (uint256) {
    uint256 unlockTime = AssetLocker(locker).unlockTime();
    if (unlockTime <= block.timestamp) return 0;
    return (unlockTime - block.timestamp) * amountPerSecond();
  }

  function shortenUnlockTime(address payable locker, uint256 shortenedTime)
  external payable {
    uint256 amount = getAmountForShortenUnlockTime(locker, shortenedTime);
    if (amount == 0) revert LockerHasBeenUnlocked(locker);
    _receive(govToken(), amount);
    AssetLocker(locker).shortenUnlockTime(shortenedTime);
  }

  function getAmountForShortenUnlockTime(address payable locker, uint256 shortenedTime)
  public view
  returns (uint256) {
    uint256 unlockTime = AssetLocker(locker).unlockTime();
    if (unlockTime <= block.timestamp) return 0;
    uint256 lockTime = unlockTime - block.timestamp;
    if (lockTime < shortenedTime) shortenedTime = lockTime;
    return shortenedTime * amountPerSecond();
  }

  function transferGuardianship(address payable locker, address newGuardian)
  external
  onlyOwner {
    AssetLocker(locker).transferGuardianship(newGuardian);
  }
}
