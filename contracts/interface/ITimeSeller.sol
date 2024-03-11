// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITimeSeller {

  event SetCurrenciesAndRates(address[] currencies, uint256[] rates);
  event Sold(address indexed customer, address indexed token, uint256 quantity, address indexed currency, uint256 amount);

  /**
   * @dev Get currencies and rates.
   *
   * address[] currencies
   * [
   *   0x0,     // ETH
   *   0xX...,  // WETH Contract Address
   *   0xY...,  // DAI Contract Address
   *   0xZ...,  // USDC Contract Address
   * ]
   * uint256[] rates
   * [
   *   3_600 * 3_000, // 1ETH = 3_000DAI = 10_800_000TIME (ETH has 18 decimals, TIME has 18 decimals)
   *   3_600 * 3_000, // 1WETH = 3_000DAI = 10_800_000TIME (WETH has 18 decimals, TIME has 18 decimals)
   *   3_600, // 1DAI = 3_600TIME (DAI has 18 decimals, TIME has 18 decimals)
   *   3_600 * 10 ** 12, // 1USDC = 3_600TIME (USDC has 6 decimals, TIME has 18 decimals)
   * ]
   */
  function currenciesAndRates() external view returns (address[] memory, uint256[] memory);

  /**
   * @dev Set currencies and rates.
   * Can only be called by the current owner.
   *
   * `newCurrencies` and `newRates` must have the same length.
   */
  function setCurrenciesAndRates(address[] calldata newCurrencies, uint256[] calldata newRates) external;

  /**
   * @dev Purchase a specified quantity of governance tokens.
   *
   * @param currency must be a valid currency.
   * @param quantity must be greater than `0`.
   *
   * `quantity` = 10 ** govTokenDecimals() = 1TIME
   */
  function buy(address currency, uint256 quantity) external payable;

  /**
   * @dev Get the currency amount corresponding to the governance token quantity.
   *
   * @param currency must be a valid currency.
   * @param quantity must be greater than `0`.
   *
   * 1TIME = `quantity` / (10 ** govTokenDecimals())
   * amount = `quantity` / currency rate
   *
   * The returned amount must be greater than `0`.
   */
  function getTokenAmount(address currency, uint256 quantity) external view returns (uint256 amount);

  /**
   * @dev Spend a specified amount of currency to buy tokens.
   *
   * @param currency must be a valid currency.
   * @param amount must be greater than `0`.
   */
  function spend(address currency, uint256 amount) external payable;

  /**
   * @dev Get the governance token quantity corresponding to the currency amount.
   *
   * @param currency must be a valid currency.
   * @param amount must be greater than `0`.
   *
   * 1TIME = `quantity` / (10 ** govTokenDecimals())
   * quantity = amount * currency rate
   *
   * The returned quantity could be `0`.
   */
  function getTokenQuantity(address currency, uint256 amount) external view returns (uint256 quantity);
}
