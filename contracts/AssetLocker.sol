// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAssetLocker} from "./interface/IAssetLocker.sol";
import {AssetBox} from "@timeholder/asset-box/contracts/AssetBox.sol";

contract AssetLocker is IAssetLocker, AssetBox {
  function name()
  external pure virtual override
  returns (string memory) {
    return "AssetLocker";
  }

  function version()
  external pure virtual override
  returns (string memory) {
    return "1.2.1";
  }

  error ShortenedTimeMustBeGreaterThanZero();
  error UnauthorizedAccount(address account);
  error UnlockTimeHasNotArrivedYet(uint256 timestamp);

  address private _guardian;
  uint256 private _unlockTime;

  constructor(
    address initialOwner,
    address initialGuardian,
    uint256 lockTime
  ) AssetBox(initialOwner) {
    _transferGuardianship(initialGuardian);
    _setUnlockTime(block.timestamp + lockTime);
  }

  function _authorizeWithdraw(address)
  internal view override(AssetBox) onlyOwner {
    if (block.timestamp < _unlockTime) revert UnlockTimeHasNotArrivedYet(block.timestamp);
  }

  function _authorizeCall(address)
  internal view override(AssetBox) onlyOwner {
    if (block.timestamp < _unlockTime) revert UnlockTimeHasNotArrivedYet(block.timestamp);
  }

  modifier onlyGuardian() {
    if (_guardian != msg.sender) revert UnauthorizedAccount(msg.sender);
    _;
  }

  function guardian()
  external view
  returns (address) {
    return _guardian;
  }

  function unlockTime()
  external view
  returns (uint256) {
    return _unlockTime;
  }

  function isUnlocked()
  external view
  returns (bool) {
    return block.timestamp >= _unlockTime;
  }

  function transferGuardianship(address newGuardian)
  external
  onlyGuardian {
    _transferGuardianship(newGuardian);
  }

  function _transferGuardianship(address newGuardian)
  private {
    address oldGuardian = _guardian;
    _guardian = newGuardian;
    emit GuardianshipTransferred(oldGuardian, newGuardian);
  }

  function unlock()
  external
  onlyGuardian {
    _setUnlockTime(block.timestamp);
  }

  function shortenUnlockTime(uint256 shortenedTime)
  external
  onlyGuardian {
    if (shortenedTime == 0) revert ShortenedTimeMustBeGreaterThanZero();
    _setUnlockTime(_unlockTime - shortenedTime);
  }

  function _setUnlockTime(uint256 newUnlockTime)
  private {
    _unlockTime = newUnlockTime;
    emit UpdateUnlockTime(newUnlockTime);
  }
}
