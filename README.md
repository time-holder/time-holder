<div style="width: 100%;">
  <img src="animated.svg" style="width: 100%;" alt="animated">
</div>

# ⏳ TIME Holder

[![npm version](https://img.shields.io/npm/v/@timeholder/time-holder/latest.svg)](https://www.npmjs.com/package/@timeholder/time-holder)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://github.com/time-holder/time-holder/actions/workflows/tests.yml/badge.svg)](https://github.com/time-holder/time-holder/actions/workflows/tests.yml)

🤚💎✋A cryptocurrency asset management solution that turns you into **Diamond Hands.**

## 🤔 Why Use

In the decade-long cryptocurrency bull market, why haven't many people made money?

- 🚨 **Private Key Leaked**: Users' carelessness can result in the leakage of cryptocurrency wallet private keys, enabling hackers to empty the wallet.
- 🚨 **Erroneous Authorization**: Users inadvertently grant permissions to untrustworthy contracts, enabling hackers to siphon off assets to which they've been granted access.
- 🚨 **Impulsive Transactions**: Due to market fluctuations, people often make impulsive decisions: buying high and selling low, which ultimately leads to significant asset losses.
- 🚨 **Short Sightedness**: Most people lack foresight and are short-sighted, often selling off potentially valuable assets too soon and, as a result, missing the boat to financial freedom.

Therefore, we are developing a solution aimed at helping users effectively avoid security risks, while also assisting them in overcoming human weaknesses, steadfastly holding onto valuable assets to become true **Diamond Hands.**

## 👋 Introduction

📦 Firstly, TIME Holder provides users with an exclusive **Contract Wallet** ([AssetBox](https://github.com/time-holder/asset-box)), that isolates cryptographic assets from the users' wallets. This isolation prevents asset loss that might occur from negligence, such as leaking of wallet private keys or granting incorrect authorizations.

🔒 Secondly, TIME Holder also provides a **Contract Wallet** with **Asset Locking Functionality** ([AssetLocker](#what-is-assetlocker)), allowing users to lock their assets in their own exclusive contract and set a deadline. Before the deadline is reached, users will not be able to withdraw their assets. This effectively helps users overcome human weaknesses and steadfastly hold valuable assets, becoming true **Diamond Hands.**

## 🔒 What is `AssetLocker`

- ✅ **Functionality Extension**: Serves as an enhanced version of [AssetBox](https://github.com/time-holder/asset-box) with added features.
- ✅ **Lock-in Period**: Allows users to set a lock-in period for the **Contract Wallet**, during which all assets within the **Contract Wallet** cannot be withdrawn. This effectively helps users overcome human weaknesses, curbing the impulse to sell off assets prematurely, and transforming them into true **Diamond Hands.**
- ✅ **Guardian Feature**: This functionality allows for the appointment of a guardian, who is usually a wallet address not controlled by the user (for example, the official TIME Holder contract address). The guardian's authority is limited exclusively to the early unlocking of the `AssetLocker`, with no further permissions.

## 💡 Application Scenario

- 🧘 I have poor self-control, am prone to impulsive investing, and the moment I have some money, I want to gamble it away, ultimately losing everything. I need an asset lock to forcibly secure my assets for me.
- 📈 I discovered an asset with potential for appreciation, but I am worried about not being able to hold onto it for the long term due to fears of making an impulsive sale in the future.
- 🔑 I want to set up a "Growth Fund" for my child, to save a long-term asset that will be unlocked when my child comes of age, helping my child grow better.
- 👨‍👧‍👦 I lack confidence in someone's ability to manage their assets. Although he has assured me that he will hold onto the assets for a long term, I do not trust his capacity to handle his assets and am concerned that he might squander them. However, since I cannot fully control his right to manage his assets, I might consider helping him by locking the assets in the capacity of a guardian.

## 🛠️ Technology Stack

Our project leverages a range of technologies to ensure robust smart contract development, testing, and deployment. Below is a detailed list of the technology stack we use:

- [**Solidity**](https://soliditylang.org/): The primary programming language for writing our smart contracts. Solidity is a statically-typed programming language designed for developing smart contracts that run on the Ethereum Virtual Machine (EVM).

- [**OpenZeppelin**](https://openzeppelin.com/contracts/): A library for secure smart contract development. OpenZeppelin Contracts is a library of modular, reusable, secure smart contracts, written in Solidity. It's an open-source framework for the Ethereum community.

- [**Hardhat**](https://hardhat.org/): A development environment to compile, deploy, test, and debug Ethereum software. Hardhat is designed to help developers manage and automate the recurring tasks inherent to the process of building smart contracts and dApps.

- [**Viem**](https://viem.sh/): A TypeScript Interface for Ethereum that provides low-level stateless primitives for interacting with Ethereum. An alternative to `ethers.js` and `web3.js` with a focus on reliability, efficiency, and excellent developer experience.

- [**Chai**](https://www.chaijs.com/): An assertion library for node and the browser that can be delightfully paired with any javascript testing framework. Chai is often used as the testing framework for writing tests for Ethereum smart contracts.

This technology stack provides us with the tools necessary to ensure our smart contracts are secure, reliable, and efficient. We encourage contributors to familiarize themselves with these technologies to better understand our development and testing processes.

## 🔍 Running Tests

To ensure the reliability and security of our smart contracts, we have implemented comprehensive test suites using the Chai testing framework. Follow the steps below to run the tests and verify the contracts' functionalities.

Before running the tests, make sure you have the following installed:
- Node.js (recommend using the latest stable version)
- npm (Node.js package manager)

```shell
npm install
npm run test
```

After running the tests, you'll see output in the terminal indicating whether each test has passed or failed.

## Licensing

See [LICENSE](LICENSE).

