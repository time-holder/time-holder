// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITimeSeller} from "./interface/ITimeSeller.sol";
import {Gov} from "./base/Gov.sol";

contract TimeSeller is ITimeSeller, Gov {
  function name()
  external pure virtual override
  returns (string memory) {
    return "TimeSeller";
  }

  function version()
  external pure virtual override
  returns (string memory) {
    return "1.1.0";
  }

  error InvalidArrayLength(uint256 currenciesLength, uint256 ratesLength);
  error InvalidCurrency(address currency);
  error PurchaseAmountMustBeGreaterThanZero();
  error PurchaseQuantityMustBeGreaterThanZero();
  error Underpayment();

  address[] private _currencies;
  uint256[] private _rates;

  modifier onlyValidCurrency(address currency) {
    _getCurrencyRate(currency);
    _;
  }

  modifier onlyValidAmount(uint256 amount) {
    if (amount == 0) revert PurchaseAmountMustBeGreaterThanZero();
    _;
  }

  modifier onlyValidQuantity(uint256 quantity) {
    if (quantity == 0) revert PurchaseQuantityMustBeGreaterThanZero();
    _;
  }

  function initialize(address initialGovToken, address[] calldata initialCurrencies, uint256[] calldata initialRates)
  public initializer {
    Gov.initialize(initialGovToken);
    _setCurrenciesAndRates(initialCurrencies, initialRates);
  }

  function currenciesAndRates()
  external view
  returns (address[] memory, uint256[] memory) {
    return (_currencies, _rates);
  }

  function setCurrenciesAndRates(address[] calldata newCurrencies, uint256[] calldata newRates)
  external
  onlyOwner {
    _setCurrenciesAndRates(newCurrencies, newRates);
  }

  function _setCurrenciesAndRates(address[] calldata newCurrencies, uint256[] calldata newRates)
  private {
    if (newCurrencies.length != newRates.length) {
      revert InvalidArrayLength(newCurrencies.length, newRates.length);
    }
    _currencies = newCurrencies;
    _rates = newRates;
    emit SetCurrenciesAndRates(newCurrencies, newRates);
  }

  function buy(address currency, uint256 quantity)
  external payable {
    uint256 amount = getTokenAmount(currency, quantity);
    if (currency != address(0)) {
      IERC20(currency).transferFrom(msg.sender, address(this), amount);
    } else if (msg.value < amount) {
      revert Underpayment();
    }
    IERC20(govToken()).transfer(msg.sender, quantity);
    emit Sold(msg.sender, govToken(), quantity, currency, amount);
  }

  function getTokenAmount(address currency, uint256 quantity)
  public view
  onlyValidCurrency(currency)
  onlyValidQuantity(quantity)
  returns (uint256) {
    uint256 rate = _getCurrencyRate(currency);
    uint256 amount = quantity / rate;
    return amount == 0 ? 1 : amount;
  }

  function spend(address currency, uint256 amount)
  external payable {
    uint256 quantity = getTokenQuantity(currency, amount);
    if (currency != address(0)) {
      IERC20(currency).transferFrom(msg.sender, address(this), amount);
    } else if (msg.value < amount) {
      revert Underpayment();
    }
    IERC20(govToken()).transfer(msg.sender, quantity);
    emit Sold(msg.sender, govToken(), quantity, currency, amount);
  }

  function getTokenQuantity(address currency, uint256 amount)
  public view
  onlyValidCurrency(currency)
  onlyValidAmount(amount)
  returns (uint256) {
    uint256 rate = _getCurrencyRate(currency);
    return amount * rate;
  }

  function _getCurrencyRate(address currency)
  private view
  returns (uint256) {
    for (uint256 i = 0; i < _currencies.length; i++) {
      if (_currencies[i] == currency) {
        if (_rates[i] == 0) revert InvalidCurrency(currency);
        return _rates[i];
      }
    }
    revert InvalidCurrency(currency);
  }
}
