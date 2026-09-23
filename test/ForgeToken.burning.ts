import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Burning", function () {
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

    describe("Burning", function () {

        it("Should allow owner to burn 100 FORGE", async function () {
            const amount = ethers.parseUnits("100", 18);
            await expect(forgeToken.connect(owner).burn(amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, ethers.ZeroAddress, amount);
            expect(await forgeToken.balanceOf(owner.address))
            .to.equal(ethers.parseUnits("999900", 18));
            expect(await forgeToken.totalSupply())
            .to.equal(ethers.parseUnits("999900", 18));
            expect(await forgeToken.maxSupply())
            .to.equal(ethers.parseUnits("2000000", 18));
        })

        it("Should allow user1 to get tokens and burn it", async function () {
            const amount = ethers.parseUnits("100", 18);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, amount);
            const user1Balance = await forgeToken.balanceOf(user1.address);
            expect(user1Balance).to.equal(amount);
            await expect(forgeToken.connect(user1).burn(amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(user1.address, ethers.ZeroAddress, amount);
            expect(await forgeToken.balanceOf(user1.address))
            .to.equal(0n);
            expect(await forgeToken.totalSupply())
            .to.equal(ethers.parseUnits("1000000", 18));
        })

        it("Should not allow user1 to burn more than balance", async function () {
            const amount = ethers.parseUnits("100", 18);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, amount);
            const user1Balance = await forgeToken.balanceOf(user1.address);
            expect(user1Balance).to.equal(amount);
            await expect(forgeToken.connect(user1).burn(amount + 1n))
            .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
            .withArgs(amount + 1n, amount);
        })

        it("Should allow to burn 0 tokens", async function () {
            await expect(forgeToken.connect(user1).burn(0n))
            .to.emit(forgeToken, "Transfer",)
            .withArgs(user1.address, ethers.ZeroAddress, 0n);
            expect(await forgeToken.totalSupply())
            .to.equal(ethers.parseUnits("1000000", 18));
            const user1Balance = await forgeToken.balanceOf(user1.address);
            expect(user1Balance).to.equal(0n);
        })

        it("Should allow after max supply and burn to mint again", async function () {
            const totalSupplyBefore = await forgeToken.totalSupply();
            const amount = ethers.parseUnits("1000000", 18);
            const amount2 = ethers.parseUnits("500000", 18);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, amount);
            await expect(forgeToken.connect(user1).burn(amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(user1.address, ethers.ZeroAddress, amount);
            await expect(forgeToken.connect(owner).mint(user1.address, amount2))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, amount2);
            expect(await forgeToken.balanceOf(user1.address))
            .to.equal(amount2);
            expect(await forgeToken.totalSupply())
            .to.equal(totalSupplyBefore + amount2);
        })

        it("Should allow user1 to burn owner's token after allowanc", async function () {
        await forgeToken.approve(user1.address, 15n);
        const ownerBalanceBefore = await forgeToken.balanceOf(owner.address);
        const totalSupplyBefore = await forgeToken.totalSupply();
        await expect(forgeToken.connect(user1).burnFrom(owner.address, 10n))
        .to.emit(forgeToken, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, 10n);
        expect(await forgeToken.allowance(owner.address, user1.address))
        .to.equal(5n);
        expect(await forgeToken.balanceOf(owner.address))
        .to.equal(ownerBalanceBefore - 10n);
        expect(await forgeToken.totalSupply())
        .to.equal(totalSupplyBefore - 10n);
        expect(await forgeToken.allowance(owner.address, user1.address))
        .to.equal(5n); 
        })

        it("Should not allowe to burn more then allowance from", async function() {
            await forgeToken.approve(user1.address, 15n);
            await expect(forgeToken.connect(user1).burnFrom(owner.address, 25n))
            .to.be.revertedWithCustomError(forgeToken, "InsufficientAllowance")
            .withArgs(25n, 15n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(15n); 
        })

        it("Should not allowe to burn more then balance from", async function() {
            const ownerBalance = await forgeToken.balanceOf(owner.address);
            const bigAmount = ownerBalance + 100n;
            await forgeToken.approve(user1.address, bigAmount);
            await expect(forgeToken.connect(user1).burnFrom(owner.address, bigAmount))
            .to.be.revertedWithCustomError(forgeToken, "InsufficientBalance")
            .withArgs(bigAmount, ownerBalance);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(bigAmount); 
        })

        it("Should allow burnFrom with 0 amount", async function() {
            await forgeToken.approve(user1.address, 15n);
            await expect(forgeToken.connect(user1).burnFrom(owner.address, 0n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, ethers.ZeroAddress, 0n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(15n); 
        })

        it("Should not allow burnFrom while paused", async function() {
            await forgeToken.approve(user1.address, 15n);
            await forgeToken.pause();
            await expect(forgeToken.connect(user1).burnFrom(owner.address, 0n))
            .to.be.revertedWithCustomError(forgeToken, "ContractPaused");
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(15n); 
        })

        it("Should not allow burnFrom from 0 address", async function() {
            await forgeToken.approve(user1.address, 15n);
            await expect(forgeToken.connect(user1).burnFrom(ethers.ZeroAddress, 0n))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(15n); 
        })

        it("Should type(uint256).max allowance to not decrease on burnFrom", async function() {
            await forgeToken.approve(user1.address, ethers.MaxUint256);
            const ownerBalanceBefore = await forgeToken.balanceOf(owner.address);
            await expect(forgeToken.connect(user1).burnFrom(owner.address, 10n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, ethers.ZeroAddress, 10n);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(ethers.MaxUint256); 
            expect(await forgeToken.balanceOf(owner.address))
            .to.equal(ownerBalanceBefore - 10n);
        })

    })
});