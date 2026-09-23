import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Minting", function () {
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

    describe("Minting", function () {

        it("Should be allowed for owner to mint token", async function () {
            expect (await forgeToken.balanceOf(user1.address))
            .to.equal(0n);
            const amount = ethers.parseUnits("100", 18);
            await forgeToken.connect(owner).mint(user1.address, amount);
            expect (await forgeToken.balanceOf(user1.address))
            .to.equal(amount);
        })

        it("Should increase total supply when mint", async function () {
            const totalSupplyBefore = await forgeToken.totalSupply();
            const amount = ethers.parseUnits("100", 18);
            await forgeToken.connect(owner).mint(user1.address, amount);
            expect (await forgeToken.totalSupply())
            .to.equal(totalSupplyBefore + amount);
        })

        it("Should allow mint to emit transfer", async function () {
            const amount = ethers.parseUnits("100", 18);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, amount);
        })

        it("Should not allow to not owner user to mint", async function () {
            const amount = ethers.parseUnits("100", 18);
            await expect(forgeToken.connect(user1).mint(owner.address, amount))
            .to.be.revertedWithCustomError(forgeToken, "NotOwner")
            .withArgs(user1.address);
        })

        it("Should not allow to mint to 0 address", async function () {
            const amount = ethers.parseUnits("100", 18);
            await expect(forgeToken.connect(owner).mint(ethers.ZeroAddress, amount))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
        })

        it("Should set max supply in 18 decimals", async function () {
            const amount = ethers.parseUnits("2000000", 18);
            expect (await forgeToken.maxSupply())
            .to.equal(amount);
        })

        it("Should not allowe contract to deploy if supply exceed max supply", async function () {
            await expect (ethers.deployContract("ForgeToken", ["Forge Token", "FORGE", 3000000, 2000000]))
            .to.be.revertedWithCustomError(forgeToken, "MaxSupplyExceeded")
            .withArgs(ethers.parseUnits("3000000", 18), ethers.parseUnits("2000000", 18));
        })

        it("Should not allowe to mint if total supply exceed max supply", async function () {
            const amount = ethers.parseUnits("2000000", 18);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.be.revertedWithCustomError(forgeToken, "MaxSupplyExceeded")
            .withArgs(amount, ethers.parseUnits("1000000", 18));
        })

        it("Should allowe owner to mint all posible remaining supply", async function () {
            const amount = ethers.parseUnits("1000000", 18);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, amount);
            expect(await forgeToken.totalSupply())
            .to.equal(await forgeToken.maxSupply());
        })

        it("Should be total and max supply equal after reaching limit", async function () {
            const amount = ethers.parseUnits("1000000", 18);
            await forgeToken.connect(owner).mint(user1.address, amount);
            expect (await forgeToken.totalSupply())
            .to.equal(await forgeToken.maxSupply());
        })

        it("Should not change total supply after bad mint attempt", async function () {
            const amount = ethers.parseUnits("2000000", 18);
            const balanceBefore = await forgeToken.balanceOf(user1.address);
            await expect(forgeToken.connect(owner).mint(user1.address, amount))
            .to.be.revertedWithCustomError(forgeToken, "MaxSupplyExceeded")
            .withArgs(amount, ethers.parseUnits("1000000", 18));
            expect(await forgeToken.totalSupply())
            .to.equal(ethers.parseUnits("1000000", 18));
            expect(await forgeToken.balanceOf(user1.address))
            .to.equal(balanceBefore);
        })

        it("Should not allowe to mint if total supply is equal to max supply", async function () {
            const amount = ethers.parseUnits("1000000", 18);
            await forgeToken.connect(owner).mint(user1.address, amount);
            await expect(forgeToken.connect(owner).mint(user1.address, 1n))
            .to.be.revertedWithCustomError(forgeToken, "MaxSupplyExceeded")
            .withArgs(1n, 0n);
        })
    })
});