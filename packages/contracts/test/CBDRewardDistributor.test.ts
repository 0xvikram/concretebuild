import { expect } from "chai";
import { ethers } from "hardhat";
import { CBDRewardDistributor } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CBDRewardDistributor", function () {
  let distributor: CBDRewardDistributor;
  let mockCbld: any;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let propertyOwner: SignerWithAddress;

  const LISTING_REWARD = ethers.parseEther("500"); // 500 CBLD
  const RENT_REWARD = ethers.parseEther("100"); // 100 CBLD

  beforeEach(async function () {
    [admin, operator, investor1, investor2, propertyOwner] = await ethers.getSigners();

    // Deploy mock CBLD token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockCbld = await MockERC20.deploy("Concrete Build", "CBLD", 18);

    // Deploy CBDRewardDistributor
    const CBDRewardDistributor = await ethers.getContractFactory("CBDRewardDistributor");
    distributor = await CBDRewardDistributor.deploy(
      await mockCbld.getAddress(),
      admin.address,
      LISTING_REWARD,
      0, // Not used anymore with 9% calculation
      RENT_REWARD
    );

    // Grant operator role
    const OPERATOR_ROLE = await distributor.OPERATOR_ROLE();
    await distributor.connect(admin).grantRole(OPERATOR_ROLE, operator.address);

    // Fund distributor with CBLD
    const fundAmount = ethers.parseEther("1000000"); // 1M CBLD
    await mockCbld.mint(admin.address, fundAmount);
    await mockCbld.connect(admin).approve(await distributor.getAddress(), fundAmount);
    await distributor.connect(admin).fundDistributor(fundAmount);
  });

  describe("Deployment", function () {
    it("Should set correct initial values", async function () {
      expect(await distributor.listingRewardAmount()).to.equal(LISTING_REWARD);
      expect(await distributor.rentPaymentRewardAmount()).to.equal(RENT_REWARD);
    });

    it("Should grant admin and operator roles", async function () {
      const ADMIN_ROLE = await distributor.ADMIN_ROLE();
      const OPERATOR_ROLE = await distributor.OPERATOR_ROLE();
      
      expect(await distributor.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await distributor.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
    });
  });

  describe("Investment Rewards (9% CBLD)", function () {
    it("Should calculate 9% CBLD reward correctly for $1000 investment", async function () {
      const usdcAmount = ethers.parseUnits("1000", 6); // $1000 USDC
      const expectedReward = ethers.parseEther("90"); // 9% = 90 CBLD

      await expect(distributor.connect(operator).issueInvestmentReward(investor1.address, usdcAmount, 1))
        .to.emit(distributor, "RewardIssued")
        .withArgs(investor1.address, expectedReward, "INVESTMENT", 1, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await mockCbld.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should calculate 9% CBLD reward correctly for $10,000 investment", async function () {
      const usdcAmount = ethers.parseUnits("10000", 6); // $10,000 USDC
      const expectedReward = ethers.parseEther("900"); // 9% = 900 CBLD

      await distributor.connect(operator).issueInvestmentReward(investor1.address, usdcAmount, 1);
      expect(await mockCbld.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should calculate 9% CBLD reward correctly for $50,000 investment", async function () {
      const usdcAmount = ethers.parseUnits("50000", 6); // $50,000 USDC
      const expectedReward = ethers.parseEther("4500"); // 9% = 4500 CBLD

      await distributor.connect(operator).issueInvestmentReward(investor1.address, usdcAmount, 1);
      expect(await mockCbld.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should handle small investment amounts", async function () {
      const usdcAmount = ethers.parseUnits("100", 6); // $100 USDC
      const expectedReward = ethers.parseEther("9"); // 9% = 9 CBLD

      await distributor.connect(operator).issueInvestmentReward(investor1.address, usdcAmount, 1);
      expect(await mockCbld.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should not issue reward for zero amount", async function () {
      await distributor.connect(operator).issueInvestmentReward(investor1.address, 0, 1);
      expect(await mockCbld.balanceOf(investor1.address)).to.equal(0);
    });
  });

  describe("Listing Rewards", function () {
    it("Should issue listing reward to property owner", async function () {
      await expect(distributor.connect(operator).issueListingReward(propertyOwner.address, 1))
        .to.emit(distributor, "RewardIssued")
        .withArgs(propertyOwner.address, LISTING_REWARD, "LISTING", 1, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await mockCbld.balanceOf(propertyOwner.address)).to.equal(LISTING_REWARD);
    });
  });

  describe("Rent Rewards", function () {
    it("Should issue rent reward", async function () {
      await expect(distributor.connect(operator).issueRentReward(investor1.address, 1))
        .to.emit(distributor, "RewardIssued")
        .withArgs(investor1.address, RENT_REWARD, "RENT", 1, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await mockCbld.balanceOf(investor1.address)).to.equal(RENT_REWARD);
    });
  });

  describe("Manual Rewards", function () {
    it("Should allow admin to issue manual reward", async function () {
      const manualAmount = ethers.parseEther("250");
      
      await expect(distributor.connect(admin).issueManualReward(investor1.address, manualAmount, "BONUS", 0))
        .to.emit(distributor, "RewardIssued")
        .withArgs(investor1.address, manualAmount, "BONUS", 0, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await mockCbld.balanceOf(investor1.address)).to.equal(manualAmount);
    });

    it("Should revert if non-admin tries manual reward", async function () {
      await expect(distributor.connect(operator).issueManualReward(investor1.address, ethers.parseEther("100"), "BONUS", 0))
        .to.be.reverted;
    });
  });

  describe("Batch Rewards", function () {
    it("Should issue batch rewards correctly", async function () {
      const recipients = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];

      await distributor.connect(operator).batchIssueRewards(recipients, amounts, "AIRDROP", 0);

      expect(await mockCbld.balanceOf(investor1.address)).to.equal(amounts[0]);
      expect(await mockCbld.balanceOf(investor2.address)).to.equal(amounts[1]);
    });

    it("Should revert if arrays length mismatch", async function () {
      const recipients = [investor1.address, investor2.address];
      const amounts = [ethers.parseEther("100")];

      await expect(distributor.connect(operator).batchIssueRewards(recipients, amounts, "AIRDROP", 0))
        .to.be.revertedWith("Length mismatch");
    });
  });

  describe("Reward Configuration", function () {
    it("Should allow admin to update listing reward", async function () {
      const newAmount = ethers.parseEther("1000");
      
      await expect(distributor.connect(admin).setListingReward(newAmount))
        .to.emit(distributor, "RewardConfigUpdated")
        .withArgs("LISTING", newAmount);

      expect(await distributor.listingRewardAmount()).to.equal(newAmount);
    });

    it("Should allow admin to update rent reward", async function () {
      const newAmount = ethers.parseEther("200");
      
      await expect(distributor.connect(admin).setRentReward(newAmount))
        .to.emit(distributor, "RewardConfigUpdated")
        .withArgs("RENT", newAmount);

      expect(await distributor.rentPaymentRewardAmount()).to.equal(newAmount);
    });
  });

  describe("Access Control", function () {
    it("Should revert if non-operator tries to issue reward", async function () {
      await expect(distributor.connect(investor1).issueListingReward(propertyOwner.address, 1))
        .to.be.reverted;
    });

    it("Should revert if insufficient CBLD in distributor", async function () {
      // Withdraw all CBLD
      const balance = await mockCbld.balanceOf(await distributor.getAddress());
      await distributor.connect(admin).withdrawCBLD(admin.address, balance);

      await expect(distributor.connect(operator).issueListingReward(propertyOwner.address, 1))
        .to.be.revertedWithCustomError(distributor, "InsufficientCBLD");
    });
  });

  describe("Total Rewards Tracking", function () {
    it("Should track total rewards issued", async function () {
      await distributor.connect(operator).issueListingReward(propertyOwner.address, 1);
      await distributor.connect(operator).issueInvestmentReward(investor1.address, ethers.parseUnits("1000", 6), 1);

      const expectedTotal = LISTING_REWARD + ethers.parseEther("90");
      expect(await distributor.totalRewardsIssued()).to.equal(expectedTotal);
    });
  });
});
