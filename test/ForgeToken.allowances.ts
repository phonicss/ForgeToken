import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Allowances", function () {
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

    describe("Allowances", function () {

        it("Should set allowance correctly", async function () {
            await forgeToken.approve(user1.address, 10n);
            expect (await forgeToken.allowance(owner.address, user1.address))
            .to.equal(10n);
        })
        
        it("Should emit Approval event on approve", async function () {
            await expect(forgeToken.approve(user1.address, 10n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 10n);
        })

        it("Should refresh allowance with new amount", async function () {
            await forgeToken.approve(user1.address, 10n);
            expect (await forgeToken.allowance(owner.address, user1.address))
            .to.equal(10n);
            await forgeToken.approve(user1.address, 20n);
            expect (await forgeToken.allowance(owner.address, user1.address))
            .to.equal(20n);
        })

        it("Should allow to set allowance to 0", async function () {
            await forgeToken.approve(user1.address, 10n);
            expect (await forgeToken.allowance(owner.address, user1.address))
            .to.equal(10n);
            await expect(forgeToken.approve(user1.address, 0n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 0n);
            expect (await forgeToken.allowance(owner.address, user1.address))
            .to.equal(0n);
        })

        it("Should revert approve when spender is address 0", async function () {
            await expect(forgeToken.approve(ethers.ZeroAddress, 10n))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
        })


        it("Should increase allowance", async function () {
            await forgeToken.approve(user1.address, 100n);
            await expect(forgeToken.increaseAllowance(user1.address, 40n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 100n + 40n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(100n + 40n);
        })

        it("Should increase allowance from 0", async function () {
            await forgeToken.approve(user1.address, 0n);
            await expect(forgeToken.increaseAllowance(user1.address, 40n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 40n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(40n);
        })

        it("Should decrease allowance", async function () {
            await forgeToken.approve(user1.address, 100n);
            await expect(forgeToken.decreaseAllowance(user1.address, 40n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 100n - 40n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(100n - 40n);
        })

        it("Should not decrease allowance below 0", async function () {
            await forgeToken.approve(user1.address, 100n);
            await expect(forgeToken.decreaseAllowance(user1.address, 140n))
            .to.be.revertedWithCustomError(forgeToken, "InsufficientAllowance")
            .withArgs(140n, 100n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(100n);
        })

        it("Should not allow to increase allowance for 0 address", async function () {
            await expect(forgeToken.increaseAllowance(ethers.ZeroAddress, 0n))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
        })

        it("Should not allow to decrease allowance for 0 address", async function () {
            await expect(forgeToken.decreaseAllowance(ethers.ZeroAddress, 0n))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
        })

        it("Should decrease allowance to 0", async function () {
            await forgeToken.approve(user1.address, 40n);
            await expect(forgeToken.decreaseAllowance(user1.address, 40n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 0n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(0n);
        })

        it("Should allow changing allowance while paused", async function () {
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            await forgeToken.approve(user1.address, 10n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(10n);
            await forgeToken.increaseAllowance(user1.address, 10n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(20n);
            await forgeToken.decreaseAllowance(user1.address, 5n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(15n);
        })

        it("Should change allowance only for caller", async function () {
            await forgeToken.approve(user1.address, 100n);
            await forgeToken.connect(user1).approve(user2.address, 50n);
            await expect(forgeToken.increaseAllowance(user1.address, 40n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 100n + 40n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(100n + 40n);
            expect(await forgeToken.allowance(user1.address, user2.address))
            .to.equal(50n);
        })

        it("Should revert when allowance increase overflow", async function () {
            await forgeToken.approve(user1.address, ethers.MaxUint256);
            await expect(forgeToken.increaseAllowance(user1.address, 1n))
            .to.be.revertedWithPanic(0x11);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(ethers.MaxUint256);
        })
    })
});