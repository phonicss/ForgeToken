import { expect } from "chai";
import { deployForgeTokenFixture } from "./helpers/deployForgeToken.js";

describe("ForgeToken - Access", function () {
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

     describe("Ownership", function () {

        it("Should allow owner to transfer ownership", async function () {
            await expect(forgeToken.connect(owner).transferOwnership(user1.address))
            .to.emit(forgeToken, "OwnershipTransferred")
            .withArgs(owner.address, user1.address);
            expect(await forgeToken.owner())
            .to.equal(user1.address);
        })
    
        it("Should not allow non-owner to transfer ownership", async function () {
            await expect(forgeToken.connect(user1).transferOwnership(user2.address))
            .to.be.revertedWithCustomError(forgeToken, "NotOwner")
            .withArgs(user1.address);
        })
    
        it("Should not allow to transfer ownership to 0 address", async function () {
            await expect(forgeToken.connect(owner).transferOwnership(ethers.ZeroAddress))
            .to.be.revertedWithCustomError(forgeToken, "ZeroAddress");
        })

        it("Should emit OwnershipTransferred event on transferOwnership", async function () {
            await expect(forgeToken.connect(owner).transferOwnership(user1.address))
            .to.emit(forgeToken, "OwnershipTransferred")
            .withArgs(owner.address, user1.address);
        })

        it("Should not allow old owner to mint", async function () {
            await forgeToken.connect(owner).transferOwnership(user1.address);
            await expect(forgeToken.connect(owner).mint(user2.address, 100n))
            .to.be.revertedWithCustomError(forgeToken, "NotOwner")
            .withArgs(owner.address);
        })

        it("Should allow new owner to mint", async function () {
            await forgeToken.connect(owner).transferOwnership(user1.address);
            await expect(forgeToken.connect(user1).mint(user2.address, 100n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user2.address, 100n);
        })
    })

    describe("Pausable", function () {

        it("Should allow only owner to pause and unpause", async function () {
            expect(await forgeToken.paused())
            .to.equal(false);
            await expect(forgeToken.connect(user1).pause())
            .to.be.revertedWithCustomError(forgeToken, "NotOwner")
            .withArgs(user1.address);
            expect(await forgeToken.paused())
            .to.equal(false);
            await expect(forgeToken.connect(owner).pause())
            .to.emit(forgeToken, "Paused")
            .withArgs(owner.address);
            expect(await forgeToken.paused())
            .to.equal(true);
            await expect(forgeToken.connect(user1).unpause())
            .to.be.revertedWithCustomError(forgeToken, "NotOwner")
            expect(await forgeToken.paused())
            .to.equal(true);
        })

        it("Should not allow to call pause twice", async function () {
            expect(await forgeToken.paused())
            .to.equal(false);
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            await expect(forgeToken.pause())
            .to.be.revertedWithCustomError(forgeToken, "ContractPaused");
            expect(await forgeToken.paused())
            .to.equal(true);
        })

        it("Should not allow call unpause if contract is not paused", async function () {
            expect(await forgeToken.paused())
            .to.equal(false);
            await expect(forgeToken.unpause())
            .to.be.revertedWithCustomError(forgeToken, "ContractNotPaused");
            expect(await forgeToken.paused())
            .to.equal(false);
        })

        it("Should allow to unpause after pause", async function () {
            expect(await forgeToken.paused())
            .to.equal(false);
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            await expect(forgeToken.unpause())
            .to.emit(forgeToken, "Unpaused")
            .withArgs(owner.address);
            expect(await forgeToken.paused())
            .to.equal(false);
        })

        it("Should not allow to transfer when paused", async function () {
            await forgeToken.pause();
            await expect(forgeToken.transfer(user1.address, 10n))
            .to.be.revertedWithCustomError(forgeToken, "ContractPaused");
        })

        it("Should not allow to transferFrom when paused", async function () {
            await forgeToken.approve(user1.address, 10n);
            await forgeToken.pause();
            await expect(forgeToken.connect(user1).transferFrom(owner.address, user2.address, 10n))
            .to.be.revertedWithCustomError(forgeToken, "ContractPaused");
        })

        it("Should not allow to mint when paused", async function () {
            await forgeToken.pause();
            await expect(forgeToken.connect(owner).mint(user1.address, 10n))
            .to.be.revertedWithCustomError(forgeToken, "ContractPaused");
        })

        it("Should not allow to burn when paused", async function () {
            await forgeToken.pause();
            await expect(forgeToken.connect(owner).burn(10n))
            .to.be.revertedWithCustomError(forgeToken, "ContractPaused");
        })

        it("Should allow to approve when paused", async function () {
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            await expect(forgeToken.approve(user1.address, 10n))
            .to.emit(forgeToken, "Approval")
            .withArgs(owner.address, user1.address, 10n);
        })

        it("Should allow to check allowance when paused", async function () {
            await forgeToken.approve(user1.address, 10n);
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            expect(await forgeToken.allowance(owner.address, user1.address))
            .to.equal(10n);
        })

        it("Should allow to check balance when paused", async function () {
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            expect(await forgeToken.balanceOf(owner.address))
            .to.equal(ethers.parseUnits("1000000", 18));
        })

        it("Should allow call functions after unpause", async function () {
            await forgeToken.pause();
            expect(await forgeToken.paused())
            .to.equal(true);
            await forgeToken.unpause();
            expect(await forgeToken.paused())
            .to.equal(false);
            await expect(forgeToken.transfer(user1.address, 10n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, user1.address, 10n);
            await expect(forgeToken.connect(owner).mint(user1.address, 10n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(ethers.ZeroAddress, user1.address, 10n);
            await expect(forgeToken.connect(owner).burn(10n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, ethers.ZeroAddress, 10n);
            await forgeToken.approve(user1.address, 10n);
            await expect(forgeToken.connect(user1).transferFrom(owner.address, user2.address, 10n))
            .to.emit(forgeToken, "Transfer")
            .withArgs(owner.address, user2.address, 10n);
        })
    })
});