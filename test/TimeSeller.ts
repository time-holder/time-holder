import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { viem, ethers } from 'hardhat'
import { assert } from 'chai'
import { getAddress, parseUnits } from 'viem'
import {
  deployContracts,
  claimAssets,
} from '@timeholder/asset-box/dist/test/common'
import type {
  PublicClient,
  WalletClient,
} from '@timeholder/asset-box/dist/test/common'
import type { TestTypes } from './common'
import { testGov } from './asserts/Gov'
import { deployProxy } from '../utils'

describe('TimeSeller', () => {
  async function deployFixture() {
    const publicClient = (await viem.getPublicClient()) as PublicClient
    const [guardian, user, hacker] =
      (await viem.getWalletClients()) as WalletClient[]

    const testContracts = await deployContracts()
    const { WETH, DAI, USDC } = testContracts
    const TIME = await viem.deployContract('TIME')

    const currencies = [
      getAddress(ethers.ZeroAddress),
      getAddress(WETH.address),
      getAddress(DAI.address),
      getAddress(USDC.address),
    ]
    const rates = [
      3_600n * 3_000n,
      3_600n * 3_000n,
      3_600n,
      3_600n * 10n ** 12n,
    ]
    const TimeSeller = (await deployProxy(
      'TimeSeller',
      [TIME.address, currencies, rates],
      {
        initializer: 'initialize(address,address[],uint256[])',
        kind: 'uups',
      },
    )) as unknown as TestTypes['TimeSeller']

    await claimAssets(user, testContracts)
    await guardian.writeContract({
      address: TIME.address,
      abi: TIME.abi,
      functionName: 'transfer',
      args: [TimeSeller.address, ((await TIME.read.totalSupply()) * 7n) / 10n],
    })

    return {
      ...testContracts,
      TIME,
      TimeSeller,
      publicClient,
      guardian,
      user,
      hacker,
      currencies,
      rates,
    }
  }

  testGov(
    'TimeSeller',
    async () => {
      const { TIME, TimeSeller, guardian } = await deployFixture()
      return {
        TIME,
        Gov: TimeSeller as unknown as TestTypes['Gov'],
        owner: guardian,
      }
    },
    {
      State: {
        extra: () => {
          it('#currenciesAndRates()', async () => {
            const { TimeSeller, currencies, rates } =
              await loadFixture(deployFixture)
            assert.deepEqual(await TimeSeller.read.currenciesAndRates(), [
              currencies,
              rates,
            ])
          })
        },
      },
      Security: {
        extra: () => {
          it('#setCurrenciesAndRates()', async () => {
            const { TimeSeller, guardian, hacker, currencies, rates } =
              await loadFixture(deployFixture)
            const newCurrencies = currencies.concat().reverse()
            const newRates = rates.concat().reverse()
            await assert.isRejected(
              hacker.writeContract({
                address: TimeSeller.address,
                abi: TimeSeller.abi,
                functionName: 'setCurrenciesAndRates',
                args: [newCurrencies, newRates],
              }),
              'OwnableUnauthorizedAccount',
            )

            await guardian.writeContract({
              address: TimeSeller.address,
              abi: TimeSeller.abi,
              functionName: 'setCurrenciesAndRates',
              args: [newCurrencies, newRates],
            })
            assert.deepEqual(await TimeSeller.read.currenciesAndRates(), [
              newCurrencies,
              newRates,
            ])
          })
        },
      },
    },
  )

  describe('Functions', () => {
    it('#buy() #getTokenAmount()', async () => {
      const { TIME, WETH, DAI, USDC, TimeSeller, user, currencies, rates } =
        await loadFixture(deployFixture)
      const currencyETH = currencies[0]
      const currencyWETH = currencies[1]
      const currencyDAI = currencies[2]
      const currencyUSDC = currencies[3]
      const quantityETH = rates[0] * parseUnits('1', 18)
      const quantityWETH = rates[1] * parseUnits('1', 18)
      const quantityDAI = rates[2] * parseUnits('1', 18)
      const quantityUSDC = rates[3] * parseUnits('1', 6)

      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'buy',
          args: [currencyETH, 0],
        }),
        'PurchaseQuantityMustBeGreaterThanZero',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'buy',
          args: [currencyUSDC, 0],
        }),
        'PurchaseQuantityMustBeGreaterThanZero',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'buy',
          args: [currencyETH, quantityETH],
        }),
        'Underpayment',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'buy',
          args: [currencyWETH, quantityWETH],
        }),
        'ERC20InsufficientAllowance',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'buy',
          args: [currencyDAI, quantityDAI],
        }),
        'ERC20InsufficientAllowance',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'buy',
          args: [currencyUSDC, quantityUSDC],
        }),
        'ERC20InsufficientAllowance',
      )

      const amountETH = await TimeSeller.read.getTokenAmount([
        currencyETH,
        quantityETH,
      ])
      const amountWETH = await TimeSeller.read.getTokenAmount([
        currencyWETH,
        quantityWETH,
      ])
      const amountDAI = await TimeSeller.read.getTokenAmount([
        currencyDAI,
        quantityDAI,
      ])
      const amountUSDC = await TimeSeller.read.getTokenAmount([
        currencyUSDC,
        quantityUSDC,
      ])
      assert.equal(amountETH, parseUnits('1', 18))
      assert.equal(amountWETH, parseUnits('1', 18))
      assert.equal(amountDAI, parseUnits('1', 18))
      assert.equal(amountUSDC, parseUnits('1', 6))

      const balance = await TIME.read.balanceOf([user.account.address])
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'buy',
        args: [currencyETH, quantityETH],
        value: amountETH,
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH,
      )

      await user.writeContract({
        address: WETH.address,
        abi: WETH.abi,
        functionName: 'approve',
        args: [TimeSeller.address, amountWETH],
      })
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'buy',
        args: [currencyWETH, quantityWETH],
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH + quantityWETH,
      )

      await user.writeContract({
        address: DAI.address,
        abi: DAI.abi,
        functionName: 'approve',
        args: [TimeSeller.address, amountDAI],
      })
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'buy',
        args: [currencyDAI, quantityDAI],
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH + quantityWETH + quantityDAI,
      )

      await user.writeContract({
        address: USDC.address,
        abi: USDC.abi,
        functionName: 'approve',
        args: [TimeSeller.address, amountUSDC],
      })
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'buy',
        args: [currencyUSDC, quantityUSDC],
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH + quantityWETH + quantityDAI + quantityUSDC,
      )
    })

    it('#spend() #getTokenQuantity()', async () => {
      const { TIME, WETH, DAI, USDC, TimeSeller, user, currencies, rates } =
        await loadFixture(deployFixture)
      const currencyETH = currencies[0]
      const currencyWETH = currencies[1]
      const currencyDAI = currencies[2]
      const currencyUSDC = currencies[3]
      const amountETH = parseUnits('1', 18)
      const amountWETH = parseUnits('1', 18)
      const amountDAI = parseUnits('1', 18)
      const amountUSDC = parseUnits('1', 6)

      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'spend',
          args: [currencyETH, 0],
        }),
        'PurchaseAmountMustBeGreaterThanZero',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'spend',
          args: [currencyUSDC, 0],
        }),
        'PurchaseAmountMustBeGreaterThanZero',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'spend',
          args: [currencyETH, amountETH],
        }),
        'Underpayment',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'spend',
          args: [currencyWETH, amountWETH],
        }),
        'ERC20InsufficientAllowance',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'spend',
          args: [currencyDAI, amountDAI],
        }),
        'ERC20InsufficientAllowance',
      )
      await assert.isRejected(
        user.writeContract({
          address: TimeSeller.address,
          abi: TimeSeller.abi,
          functionName: 'spend',
          args: [currencyUSDC, amountUSDC],
        }),
        'ERC20InsufficientAllowance',
      )

      const quantityETH = await TimeSeller.read.getTokenQuantity([
        currencyETH,
        amountETH,
      ])
      const quantityWETH = await TimeSeller.read.getTokenQuantity([
        currencyWETH,
        amountWETH,
      ])
      const quantityDAI = await TimeSeller.read.getTokenQuantity([
        currencyDAI,
        amountDAI,
      ])
      const quantityUSDC = await TimeSeller.read.getTokenQuantity([
        currencyUSDC,
        amountUSDC,
      ])
      assert.equal(quantityETH, rates[0] * parseUnits('1', 18))
      assert.equal(quantityWETH, rates[1] * parseUnits('1', 18))
      assert.equal(quantityDAI, rates[2] * parseUnits('1', 18))
      assert.equal(quantityUSDC, rates[3] * parseUnits('1', 6))

      const balance = await TIME.read.balanceOf([user.account.address])
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'spend',
        args: [currencyETH, amountETH],
        value: amountETH,
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH,
      )

      await user.writeContract({
        address: WETH.address,
        abi: WETH.abi,
        functionName: 'approve',
        args: [TimeSeller.address, amountWETH],
      })
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'spend',
        args: [currencyWETH, amountWETH],
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH + quantityWETH,
      )

      await user.writeContract({
        address: DAI.address,
        abi: DAI.abi,
        functionName: 'approve',
        args: [TimeSeller.address, amountDAI],
      })
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'spend',
        args: [currencyDAI, amountDAI],
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH + quantityWETH + quantityDAI,
      )

      await user.writeContract({
        address: USDC.address,
        abi: USDC.abi,
        functionName: 'approve',
        args: [TimeSeller.address, amountUSDC],
      })
      await user.writeContract({
        address: TimeSeller.address,
        abi: TimeSeller.abi,
        functionName: 'spend',
        args: [currencyUSDC, amountUSDC],
      })
      assert.equal(
        await TIME.read.balanceOf([user.account.address]),
        balance + quantityETH + quantityWETH + quantityDAI + quantityUSDC,
      )
    })
  })
})
