import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Deployment", function () {
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

    describe("Deployment", function () {

        it("Should set name and symbol correctly", async function () {
            expect (await forgeToken.name()).to.equal("Forge Token");
            expect (await forgeToken.symbol()).to.equal("FORGE");
        })

        it("Should be owner equal to deployer address", async function () {
            expect (await forgeToken.owner())
            .to.equal(owner.address);
        })

        it("Should return 18 for decimals", async function () {
            expect (await forgeToken.decimals()).to.equal(18n);
        })

        it("Should make total supply to own by the owner", async function () {
            expect (await forgeToken.balanceOf(owner.address)).to.equal(ethers.parseUnits("1000000", 18));
        })

        it("Should emit Transfer event on deployment", async function () {
            const token = await ethers.deployContract("ForgeToken", ["Forge Token", "FORGE", 1000000, 2000000]);
            await expect (token.deploymentTransaction())
            .to.emit(token, "Transfer").withArgs(ethers.ZeroAddress, owner.address, ethers.parseUnits("1000000", 18));
        })

        it("Should set total supply correctly", async function () {
            const expectedSupply = ethers.parseUnits("1000000", 18);
            expect (await forgeToken.totalSupply()).to.equal(expectedSupply);
        })

        it("Should assign entire supply to deployer", async function () {
            const ownerBalance = await forgeToken.balanceOf(owner.address);
            const totalSupply = await forgeToken.totalSupply();
            expect (ownerBalance).to.equal(totalSupply);
        })

        it("Should emit OwnershipTransferred event on deployment", async function () {
            const token = await ethers.deployContract("ForgeToken", ["Forge Token", "FORGE", 1000000, 2000000]);
            await expect (token.deploymentTransaction())
            .to.emit(token, "OwnershipTransferred").withArgs(ethers.ZeroAddress, owner.address);
        })
    })
});