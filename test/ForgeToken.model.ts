import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";
import { pseudoRandom } from "./helpers/pseudoRandom.js";

describe("ForgeToken - Model", function () {
    let ethers: any;
    let forgeToken: any;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        ({
            ethers,
            forgeToken,
            owner,
            user1,
            user2
        } = await deployForgeTokenFixture());
    });

      describe("Preperty test transfer", function () {
        const amounts = [0n, 1n, 10n, 100n, 1000n];
        for (const amount of amounts) {
            it(`Should presents totalSupply on trasnfer ${amount}`, async function () {
                const totalSupplyBefore = await forgeToken.totalSupply();
                await forgeToken.transfer(user1.address, amount);
                const totalSupplyAfter = await forgeToken.totalSupply();
                expect(totalSupplyBefore).to.equal(totalSupplyAfter);
            })
        }
    })

    describe("Property test mint", function () {
        const mintAmounts = [0n, 1n, 10n, 100n, 1000n];
        for (const amount of mintAmounts) {
            it(`Should increase totalSupplu exactly by ${amount}`, async function () {
                const totalSupplyBefore = await forgeToken.totalSupply();
                await forgeToken.mint(user1.address, amount);
                expect(await forgeToken.totalSupply())
                .to.equal(totalSupplyBefore + amount);
            })
        }
    })

    describe("Property test burn", function () {
        const burnAmounts = [0n, 1n, 10n, 100n, 1000n];
        for (const amount of burnAmounts) {
            it(`Should decrease totalSupplu exactly by ${amount}`, async function () {
                const totalSupplyBefore = await forgeToken.totalSupply();
                await forgeToken.burn(amount);
                expect(await forgeToken.totalSupply())
                .to.equal(totalSupplyBefore - amount);
            })
        }
    })

    describe("Property overall test", function () {
        const transferAmounts = [0n, 1n, 10n, 100n, 999n];
        for (const amount of transferAmounts) {
            it(`Should conserve balances on transfer ${amount}`, async function () {
                const ownerBalanceBefore = await forgeToken.balanceOf(owner.address);
                const user1BalanceBefore = await forgeToken.balanceOf(user1.address);
                await forgeToken.transfer(user1.address, amount);
                const ownerBalanceAfter = await forgeToken.balanceOf(owner.address);
                const user1BalanceAfter = await forgeToken.balanceOf(user1.address);
                expect(ownerBalanceBefore - amount).to.equal(ownerBalanceAfter);
                expect(user1BalanceBefore + amount).to.equal(user1BalanceAfter);
                expect(ownerBalanceAfter + user1BalanceAfter)
                .to.equal(ownerBalanceBefore + user1BalanceBefore);
            })
        }
    })

    describe("Randomize property tests", function () {

        it("Should preserve supply through many transfers", async function () {
            let seed = 123456n;
            const initialSupply = await forgeToken.totalSupply();
            for (let i = 0; i < 100; i++) {
                seed = pseudoRandom(seed)
                const amount = seed % 1000n;
                await forgeToken.transfer(user1.address, amount);
                await forgeToken.connect(user1).transfer(owner.address, amount);
            }
            expect(await forgeToken.totalSupply())
            .to.equal(initialSupply);
            expect(await forgeToken.balanceOf(user1.address))
            .to.equal(0n);
            expect(await forgeToken.balanceOf(owner.address))
            .to.equal(initialSupply);
        
        })
    })

    describe("Model based tests", function () {

        it("Should match TypeScript model after random operations", async function () {

            let modelOwner =
                await forgeToken.balanceOf(owner.address);

            let modelUser1 =
                await forgeToken.balanceOf(user1.address);

            let modelSupply =
                await forgeToken.totalSupply();

            let seed = 987654n;

            for (let i = 0; i < 100; i++) {

                seed = pseudoRandom(seed);

                const operation =
                    Number(seed % 3n);

                seed = pseudoRandom(seed);

                const amount =
                    seed % 1000n;

                if (operation === 0) {

                    await forgeToken.transfer(
                        user1.address,
                        amount
                    );

                    modelOwner -= amount;
                    modelUser1 += amount;

                } else if (operation === 1) {

                    await forgeToken.mint(
                        user1.address,
                        amount
                    );

                    modelUser1 += amount;
                    modelSupply += amount;

                } else {

                    await forgeToken.burn(amount);

                    modelOwner -= amount;
                    modelSupply -= amount;
                }

                expect(
                    await forgeToken.balanceOf(owner.address)
                ).to.equal(modelOwner);

                expect(
                    await forgeToken.balanceOf(user1.address)
                ).to.equal(modelUser1);

                expect(
                    await forgeToken.totalSupply()
                ).to.equal(modelSupply);

                expect(
                    modelOwner + modelUser1
                ).to.equal(modelSupply);
            }
        });
    })

    describe("Randomized revert tests", function () {

        it("Should revert burn above balance without changing state", async function () {
            let seed = 777777n;
            for(let i = 0; i < 50; i++) {
                seed = pseudoRandom(seed);
                const ownerBalanceBefore = await forgeToken.balanceOf(owner.address);
                const totalSupplyBefore = await forgeToken.totalSupply();
                const amount = ownerBalanceBefore + 1n + (seed % 1000n);
                await expect(forgeToken.burn(amount))
                .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
                .withArgs(amount, ownerBalanceBefore);
                expect(await forgeToken.balanceOf(owner.address))
                .to.equal(ownerBalanceBefore);
                expect(await forgeToken.totalSupply())
                .to.equal(totalSupplyBefore);

            }
        })

        it("Should revert transferFrom above allowance without changing state", async function () {
            let seed = 5555555n;
            for(let i = 0; i < 50; i++) {
                seed = pseudoRandom(seed);
                const allowance = seed % 1000n;
                await forgeToken.approve(user1.address, allowance);
                const amount = allowance + 1n + (seed % 100n);
                const ownerBalanceBefore = await forgeToken.balanceOf(owner.address);
                const user2BalanceBefore = await forgeToken.balanceOf(user2.address);
                const allowanceBefore = await forgeToken.allowance(owner.address, user1.address);
                await expect(forgeToken.connect(user1).transferFrom(owner.address, user2.address, amount))
                .to.be.revertedWithCustomError(forgeToken, "InsufficientAllowance")
                .withArgs(amount, allowance);
                expect(await forgeToken.balanceOf(owner.address))
                .to.equal(ownerBalanceBefore);
                expect(await forgeToken.balanceOf(user2.address))
                .to.equal(user2BalanceBefore);
                expect(await forgeToken.allowance(owner.address, user1.address))
                .to.equal(allowanceBefore);
            }
        })
        
    })

    describe("Stateful model fuzz tests", function () {
        
        it("Should match model through 200 random operations", async function () {
            let modelOwner = await forgeToken.balanceOf(owner.address);
            let modelUser1 =  await forgeToken.balanceOf(user1.address);
            let modelUser2 = await forgeToken.balanceOf(user2.address);
            let modelSupply = await forgeToken.totalSupply();
            let modelAllowance = 0n;
            const maxSupply = await forgeToken.maxSupply();
            let seed = 123456789n;

            for (let i = 0; i < 200; i++) {
                seed = pseudoRandom(seed);
                const amount = seed % (modelOwner + 2000n);
                seed = pseudoRandom(seed);
                const operation = Number(seed % 6n);

                if (operation === 0) {
                    if (amount <= modelOwner) {
                        await forgeToken.transfer(user1.address, amount);
                        modelOwner -= amount;
                        modelUser1 += amount;
                    } else {
                        await expect(forgeToken.transfer(user1.address, amount))
                        .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
                        .withArgs(amount, modelOwner);
                    }
                } else if (operation === 1) {
                    if (amount <= modelOwner) {
                        await forgeToken.burn(amount);
                        modelOwner -= amount;
                        modelSupply -= amount;
                    } else {
                        await expect (forgeToken.burn(amount))
                        .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
                        .withArgs(amount, modelOwner);
                    }
                } else if (operation === 2) {
                    const available = maxSupply - modelSupply;
                    if (amount <= available) {
                        await forgeToken.mint(user1.address, amount);
                        modelUser1 += amount;
                        modelSupply += amount;
                    } else {
                        await expect(forgeToken.mint(user1.address, amount))
                        .to.be.revertedWithCustomError(forgeToken, "MaxSupplyExceeded")
                        .withArgs(amount, available);
                    }
                } else if (operation === 3) {
                    await forgeToken.approve(user2.address, amount);
                    modelAllowance = amount;
                } else if (operation === 4) {
                    if (amount <= modelAllowance && amount <= modelOwner) {
                        await forgeToken.connect(user2)
                        .transferFrom(owner.address, user1.address, amount);
                        modelAllowance -= amount;
                        modelOwner -= amount;
                        modelUser1 += amount;
                    } else if (amount > modelAllowance) {
                        await expect(forgeToken.connect(user2).transferFrom(owner.address, user1.address, amount))
                        .to.be.revertedWithCustomError(forgeToken, "InsufficientAllowance")
                        .withArgs(amount, modelAllowance);
                    } else {
                        await expect (forgeToken.connect(user2).transferFrom(owner.address, user1.address, amount))
                        .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
                        .withArgs(amount, modelOwner);
                        
                    }
                } else if (operation === 5) {
                    if (amount <= modelAllowance && amount <= modelOwner) {
                        await forgeToken.connect(user2).burnFrom(owner.address, amount);
                        modelAllowance -= amount;
                        modelOwner -= amount;
                        modelSupply -= amount;
                    }
                }

                expect(await forgeToken.balanceOf(owner.address))
                .to.equal(modelOwner);

                expect(await forgeToken.balanceOf(user1.address))
                .to.equal(modelUser1);

                expect(await forgeToken.totalSupply())
                .to.equal(modelSupply);

                expect(modelOwner + modelUser1)
                .to.equal(modelSupply);

                expect(modelSupply)
                .to.be.lte(maxSupply);

                expect(await forgeToken.allowance(owner.address, user2.address))
                .to.equal(modelAllowance);

                expect(await forgeToken.allowance(owner.address, user2.address))
                .to.equal(modelAllowance);

                expect(modelOwner + modelUser1 + modelUser2)
                .to.equal(modelSupply);

                expect(modelSupply)
                .to.be.lte(maxSupply);
            }
        
        })    

    })
});