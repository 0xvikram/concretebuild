import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyEscrow", function () {
  let propertyEscrow: PropertyEscrow;
  let mockUsdc: any;
  let admin: SignerWithAddress;
  let propertyOwner: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let treasury: SignerWithAddress;

  const PROPERTY_ID = 1;
  const TOTAL_VALUATION = ethers.parseUnits("100000", 6); // $100,000 USDC
  const TOTAL_SHARES = 10000;

  beforeEach(async function () {
    [admin, propertyOwner, investor1, investor2, investor3, treasury] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);

    // Deploy PropertyEscrow
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    propertyEscrow = await PropertyEscrow.deploy(
      PROPERTY_ID,
      propertyOwner.address,
      admin.address,
      treasury.address,
      await mockUsdc.getAddress(),
      TOTAL_VALUATION,
      TOTAL_SHARES
    );

    // Mint USDC to investors
    await mockUsdc.mint(investor1.address, ethers.parseUnits("150000", 6));
    await mockUsdc.mint(investor2.address, ethers.parseUnits("50000", 6));
    await mockUsdc.mint(investor3.address, ethers.parseUnits("50000", 6));
    await mockUsdc.mint(propertyOwner.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set correct immutable values", async function () {
      expect(await propertyEscrow.propertyId()).to.equal(PROPERTY_ID);
      expect(await propertyEscrow.totalValuation()).to.equal(TOTAL_VALUATION);
      expect(await propertyEscrow.totalShares()).to.equal(TOTAL_SHARES);
      expect(await propertyEscrow.propertyOwner()).to.equal(propertyOwner.address);
    });

    it("Should grant admin role", async function () {
      const ADMIN_ROLE = await propertyEscrow.ADMIN_ROLE();
      expect(await propertyEscrow.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should not be active initially", async function () {
      expect(await propertyEscrow.propertyActive()).to.be.false;
      expect(await propertyEscrow.investmentOpen()).to.be.false;
    });
  });

  describe("Property Activation", function () {
    it("Should allow admin to activate property", async function () {
      await expect(propertyEscrow.connect(admin).activateProperty())
        .to.emit(propertyEscrow, "PropertyActivated")
        .withArgs(PROPERTY_ID, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await propertyEscrow.propertyActive()).to.be.true;
      expect(await propertyEscrow.investmentOpen()).to.be.true;
    });

    it("Should revert if non-admin tries to activate", async function () {
      await expect(propertyEscrow.connect(investor1).activateProperty())
        .to.be.reverted;
    });

    it("Should revert if already active", async function () {
      await propertyEscrow.connect(admin).activateProperty();
      await expect(propertyEscrow.connect(admin).activateProperty())
        .to.be.revertedWithCustomError(propertyEscrow, "AlreadyActive");
    });
  });

  describe("Investment", function () {
    beforeEach(async function () {
      await propertyEscrow.connect(admin).activateProperty();
    });

    it("Should allow investment with correct share allocation", async function () {
      const investAmount = ethers.parseUnits("10000", 6); // $10,000
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), investAmount);

      await expect(propertyEscrow.connect(investor1).invest(investAmount))
        .to.emit(propertyEscrow, "InvestmentMade");

      expect(await propertyEscrow.totalRaised()).to.equal(investAmount);
      expect(await propertyEscrow.investorShares(investor1.address)).to.equal(1000); // 10% of 10000 shares
      expect(await propertyEscrow.getSharePercentageBps(investor1.address)).to.equal(1000); // 10% in bps
    });

    it("Should handle multiple investors correctly", async function () {
      const invest1 = ethers.parseUnits("30000", 6); // 30%
      const invest2 = ethers.parseUnits("20000", 6); // 20%

      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), invest1);
      await mockUsdc.connect(investor2).approve(await propertyEscrow.getAddress(), invest2);

      await propertyEscrow.connect(investor1).invest(invest1);
      await propertyEscrow.connect(investor2).invest(invest2);

      expect(await propertyEscrow.getInvestorCount()).to.equal(2);
      expect(await propertyEscrow.totalRaised()).to.equal(invest1 + invest2);
      expect(await propertyEscrow.getSharePercentageBps(investor1.address)).to.equal(3000); // 30%
      expect(await propertyEscrow.getSharePercentageBps(investor2.address)).to.equal(2000); // 20%
    });

    it("Should auto-close when fully funded", async function () {
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), TOTAL_VALUATION);

      await expect(propertyEscrow.connect(investor1).invest(TOTAL_VALUATION))
        .to.emit(propertyEscrow, "InvestmentClosed")
        .withArgs(PROPERTY_ID, TOTAL_VALUATION);

      expect(await propertyEscrow.investmentOpen()).to.be.false;
    });

    it("Should revert if exceeds remaining amount", async function () {
      const overAmount = TOTAL_VALUATION + ethers.parseUnits("1", 6);
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), overAmount);

      await expect(propertyEscrow.connect(investor1).invest(overAmount))
        .to.be.revertedWithCustomError(propertyEscrow, "ExceedsRemaining");
    });

    it("Should revert if investment is closed", async function () {
      await propertyEscrow.connect(admin).closeInvestment();
      const investAmount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), investAmount);

      await expect(propertyEscrow.connect(investor1).invest(investAmount))
        .to.be.revertedWithCustomError(propertyEscrow, "InvestmentNotOpen");
    });

    it("Should revert if property not active", async function () {
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const newEscrow = await PropertyEscrow.deploy(
        2, propertyOwner.address, admin.address, treasury.address,
        await mockUsdc.getAddress(), TOTAL_VALUATION, TOTAL_SHARES
      );

      const investAmount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(investor1).approve(await newEscrow.getAddress(), investAmount);

      await expect(newEscrow.connect(investor1).invest(investAmount))
        .to.be.revertedWithCustomError(newEscrow, "NotActive");
    });
  });

  describe("Profit Distribution", function () {
    beforeEach(async function () {
      await propertyEscrow.connect(admin).activateProperty();

      // Setup: 3 investors with different shares
      const invest1 = ethers.parseUnits("50000", 6); // 50%
      const invest2 = ethers.parseUnits("30000", 6); // 30%
      const invest3 = ethers.parseUnits("20000", 6); // 20%

      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), invest1);
      await mockUsdc.connect(investor2).approve(await propertyEscrow.getAddress(), invest2);
      await mockUsdc.connect(investor3).approve(await propertyEscrow.getAddress(), invest3);

      await propertyEscrow.connect(investor1).invest(invest1);
      await propertyEscrow.connect(investor2).invest(invest2);
      await propertyEscrow.connect(investor3).invest(invest3);
    });

    it("Should allow property owner to deposit profit", async function () {
      const profitAmount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(propertyOwner).approve(await propertyEscrow.getAddress(), profitAmount);

      await expect(propertyEscrow.connect(propertyOwner).depositProfit(profitAmount))
        .to.emit(propertyEscrow, "ProfitDeposited")
        .withArgs(propertyOwner.address, profitAmount, profitAmount);

      expect(await propertyEscrow.totalProfitDeposited()).to.equal(profitAmount);
    });

    it("Should distribute profit proportionally", async function () {
      const profitAmount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(propertyOwner).approve(await propertyEscrow.getAddress(), profitAmount);
      await propertyEscrow.connect(propertyOwner).depositProfit(profitAmount);

      await expect(propertyEscrow.connect(admin).distributeProfit(profitAmount))
        .to.emit(propertyEscrow, "ProfitAllocated");

      // Check proportional allocation: 50%, 30%, 20%
      expect(await propertyEscrow.claimableProfit(investor1.address)).to.equal(ethers.parseUnits("500", 6));
      expect(await propertyEscrow.claimableProfit(investor2.address)).to.equal(ethers.parseUnits("300", 6));
      expect(await propertyEscrow.claimableProfit(investor3.address)).to.equal(ethers.parseUnits("200", 6));
    });

    it("Should allow investors to claim profit", async function () {
      const profitAmount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(propertyOwner).approve(await propertyEscrow.getAddress(), profitAmount);
      await propertyEscrow.connect(propertyOwner).depositProfit(profitAmount);
      await propertyEscrow.connect(admin).distributeProfit(profitAmount);

      const claimable = await propertyEscrow.claimableProfit(investor1.address);
      const balanceBefore = await mockUsdc.balanceOf(investor1.address);

      await expect(propertyEscrow.connect(investor1).claimProfit())
        .to.emit(propertyEscrow, "ProfitClaimed")
        .withArgs(investor1.address, claimable);

      expect(await mockUsdc.balanceOf(investor1.address)).to.equal(balanceBefore + claimable);
      expect(await propertyEscrow.claimableProfit(investor1.address)).to.equal(0);
    });

    it("Should revert claim if no profit available", async function () {
      await expect(propertyEscrow.connect(investor1).claimProfit())
        .to.be.revertedWithCustomError(propertyEscrow, "NoProfit");
    });

    it("Should handle multiple distribution rounds", async function () {
      // First distribution
      const profit1 = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(propertyOwner).approve(await propertyEscrow.getAddress(), profit1);
      await propertyEscrow.connect(propertyOwner).depositProfit(profit1);
      await propertyEscrow.connect(admin).distributeProfit(profit1);

      // Second distribution
      const profit2 = ethers.parseUnits("500", 6);
      await mockUsdc.connect(propertyOwner).approve(await propertyEscrow.getAddress(), profit2);
      await propertyEscrow.connect(propertyOwner).depositProfit(profit2);
      await propertyEscrow.connect(admin).distributeProfit(profit2);

      // Total claimable should be sum of both distributions
      expect(await propertyEscrow.claimableProfit(investor1.address)).to.equal(ethers.parseUnits("750", 6)); // 50% of 1500
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to pause", async function () {
      await propertyEscrow.connect(admin).pause();
      expect(await propertyEscrow.paused()).to.be.true;
    });

    it("Should prevent operations when paused", async function () {
      await propertyEscrow.connect(admin).activateProperty();
      await propertyEscrow.connect(admin).pause();

      const investAmount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), investAmount);

      await expect(propertyEscrow.connect(investor1).invest(investAmount))
        .to.be.reverted;
    });

    it("Should allow admin to update property owner", async function () {
      const newOwner = investor1.address;
      await expect(propertyEscrow.connect(admin).updatePropertyOwner(newOwner))
        .to.emit(propertyEscrow, "PropertyOwnerUpdated")
        .withArgs(propertyOwner.address, newOwner);

      expect(await propertyEscrow.propertyOwner()).to.equal(newOwner);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await propertyEscrow.connect(admin).activateProperty();
    });

    it("Should return correct remaining investment", async function () {
      const investAmount = ethers.parseUnits("30000", 6);
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), investAmount);
      await propertyEscrow.connect(investor1).invest(investAmount);

      expect(await propertyEscrow.getRemainingInvestment()).to.equal(ethers.parseUnits("70000", 6));
    });

    it("Should return correct funding progress", async function () {
      const investAmount = ethers.parseUnits("25000", 6); // 25%
      await mockUsdc.connect(investor1).approve(await propertyEscrow.getAddress(), investAmount);
      await propertyEscrow.connect(investor1).invest(investAmount);

      expect(await propertyEscrow.getFundingProgressBps()).to.equal(2500); // 25% in bps
    });
  });
});
