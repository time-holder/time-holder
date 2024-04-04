// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITimeHolder {
  event BoxCreated(address indexed box, uint256 fee);
  event SetCreationFee(uint256 fee);
  event SetAmountPerSecond(uint256 amount);

  /**
   * @dev Set the fee charged for creating a box.
   */
  function setCreationFee(uint256 fee) external;

  /**
   * @dev Returns the fee charged for creating a box.
   */
  function creationFee() external view returns (uint256);

  /**
   * @dev Create a new AssetBox.
   */
  function createAssetBox(address initialOwner) external payable returns (address);

  /**
   * @dev Create a new AssetLocker.
   */
  function createAssetLocker(address initialOwner, address initialGuardian, uint256 lockTime) external payable returns (address);

  /**
   * @dev Set the amount needed to per second.
   *
   * amount = 10 ** govTokenDecimals() (1Second = 1Token)
   */
  function setAmountPerSecond(uint256 amount) external;

  /**
   * @dev Returns the amount needed to per second.
   *
   * amount = 10 ** govTokenDecimals() (1Second = 1Token)
   */
  function amountPerSecond() external view returns (uint256);

  /**
   * @dev Unlock locker.
   */
  function unlock(address payable locker) external payable;

  /**
   * @dev Get the amount needed to unlock.
   *
   * amount = amountPerSecond() * seconds
   */
  function getAmountForUnlock(address payable locker) external view returns (uint256);

  /**
   * @dev Shorten unlock time of locker.
   *
   * @param shortenedTime is seconds and must be greater than `0`.
   */
  function shortenUnlockTime(address payable locker, uint256 shortenedTime) external payable;

  /**
   * @dev Get the amount needed to shorten unlock time.
   *
   * @param shortenedTime is seconds and must be greater than `0`.
   *
   * amount = amountPerSecond() * seconds
   */
  function getAmountForShortenUnlockTime(address payable locker, uint256 shortenedTime) external view returns (uint256);

  /**
   * @dev Transfer the guardianship of the locker to a new guardian.
   * Can only be called by the current owner.
   */
  function transferGuardianship(address payable locker, address newGuardian) external;
}
