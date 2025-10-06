import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INSUFFICIENT_BALANCE = 101;
const ERR_INVALID_AMOUNT = 102;
const ERR_INVALID_PROGRAM_ID = 103;
const ERR_NOT_VERIFIED = 104;
const ERR_ALREADY_DISTRIBUTED = 105;
const ERR_INVALID_ADMIN = 106;
const ERR_POOL_PAUSED = 107;
const ERR_INVALID_TIMESTAMP = 108;
const ERR_AUTHORITY_NOT_SET = 109;
const ERR_INVALID_FEE_RATE = 110;
const ERR_MAX_DISTRIBUTION_EXCEEDED = 111;
const ERR_INVALID_GOVERNANCE = 112;
const ERR_INVALID_ORACLE = 113;
const ERR_INVALID_REGISTRY = 114;
const ERR_PAUSE_NOT_ALLOWED = 115;
const ERR_INVALID_STATUS = 116;
const ERR_INVALID_CURRENCY = 117;
const ERR_INVALID_LOCATION = 118;
const ERR_INVALID_THRESHOLD = 119;
const ERR_INVALID_PROPOSAL_ID = 120;

interface Distribution {
  programId: number;
  amount: number;
  verified: boolean;
  timestamp: number;
  status: string;
}

interface PendingRequest {
  admin: string;
  amount: number;
  programId: number;
  timestamp: number;
}

interface DistributionHistory {
  programId: number;
  amount: number;
  timestamp: number;
  admin: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class DonationPoolMock {
  state: {
    poolBalance: number;
    isPaused: boolean;
    adminPrincipal: string;
    governanceContract: string | null;
    oracleContract: string | null;
    registryContract: string | null;
    distributionFeeRate: number;
    maxDistributionPerRequest: number;
    totalDistributed: number;
    lastDistributionTimestamp: number;
    distributions: Map<string, Distribution>;
    pendingRequests: Map<number, PendingRequest>;
    distributionHistory: Map<number, DistributionHistory>;
    allowedCurrencies: Map<string, boolean>;
    allowedLocations: Map<string, boolean>;
    verificationThresholds: Map<number, number>;
  } = {
    poolBalance: 0,
    isPaused: false,
    adminPrincipal: "ST1ADMIN",
    governanceContract: null,
    oracleContract: null,
    registryContract: null,
    distributionFeeRate: 5,
    maxDistributionPerRequest: 1000000,
    totalDistributed: 0,
    lastDistributionTimestamp: 0,
    distributions: new Map(),
    pendingRequests: new Map(),
    distributionHistory: new Map(),
    allowedCurrencies: new Map(),
    allowedLocations: new Map(),
    verificationThresholds: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      poolBalance: 0,
      isPaused: false,
      adminPrincipal: "ST1ADMIN",
      governanceContract: null,
      oracleContract: null,
      registryContract: null,
      distributionFeeRate: 5,
      maxDistributionPerRequest: 1000000,
      totalDistributed: 0,
      lastDistributionTimestamp: 0,
      distributions: new Map(),
      pendingRequests: new Map(),
      distributionHistory: new Map(),
      allowedCurrencies: new Map(),
      allowedLocations: new Map(),
      verificationThresholds: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
  }

  setGovernanceContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.governanceContract = contract;
    return { ok: true, value: true };
  }

  setOracleContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.oracleContract = contract;
    return { ok: true, value: true };
  }

  setRegistryContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.registryContract = contract;
    return { ok: true, value: true };
  }

  setDistributionFeeRate(rate: number): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (rate > 10) return { ok: false, value: ERR_INVALID_FEE_RATE };
    this.state.distributionFeeRate = rate;
    return { ok: true, value: true };
  }

  pausePool(): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.isPaused = true;
    return { ok: true, value: true };
  }

  unpausePool(): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.isPaused = false;
    return { ok: true, value: true };
  }

  addAllowedCurrency(cur: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.allowedCurrencies.set(cur, true);
    return { ok: true, value: true };
  }

  addAllowedLocation(loc: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.allowedLocations.set(loc, true);
    return { ok: true, value: true };
  }

  setVerificationThreshold(programId: number, threshold: number): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (threshold <= 0 || threshold > 100) return { ok: false, value: ERR_INVALID_THRESHOLD };
    this.state.verificationThresholds.set(programId, threshold);
    return { ok: true, value: true };
  }

  deposit(amount: number): Result<boolean> {
    if (this.state.isPaused) return { ok: false, value: ERR_POOL_PAUSED };
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    this.stxTransfers.push({ amount, from: this.caller, to: "contract" });
    this.state.poolBalance += amount;
    return { ok: true, value: true };
  }

  requestDistribution(programId: number, amount: number, admin: string, proposalId: number, cur: string, loc: string): Result<number> {
    if (this.state.isPaused) return { ok: false, value: ERR_POOL_PAUSED };
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (programId <= 0) return { ok: false, value: ERR_INVALID_PROGRAM_ID };
    if (proposalId <= 0) return { ok: false, value: ERR_INVALID_PROPOSAL_ID };
    if (!this.state.allowedCurrencies.get(cur)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (!this.state.allowedLocations.get(loc)) return { ok: false, value: ERR_INVALID_LOCATION };
    if (amount > this.state.poolBalance) return { ok: false, value: ERR_INSUFFICIENT_BALANCE };
    if (amount > this.state.maxDistributionPerRequest) return { ok: false, value: ERR_MAX_DISTRIBUTION_EXCEEDED };
    if (!this.state.governanceContract) return { ok: false, value: ERR_INVALID_GOVERNANCE };
    if (!this.state.oracleContract) return { ok: false, value: ERR_INVALID_ORACLE };
    if (!this.state.registryContract) return { ok: false, value: ERR_INVALID_REGISTRY };
    const fee = (amount * this.state.distributionFeeRate) / 100;
    const netAmount = amount - fee;
    const nextRequestId = this.state.pendingRequests.size + 1;
    this.state.pendingRequests.set(nextRequestId, { admin, amount: netAmount, programId, timestamp: this.blockHeight });
    return { ok: true, value: nextRequestId };
  }

  executeDistribution(requestId: number): Result<boolean> {
    const request = this.state.pendingRequests.get(requestId);
    if (!request) return { ok: false, value: ERR_INVALID_PROGRAM_ID };
    if (this.state.isPaused) return { ok: false, value: ERR_POOL_PAUSED };
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const { admin, amount, programId } = request;
    this.stxTransfers.push({ amount, from: "contract", to: admin });
    this.state.poolBalance -= amount;
    this.state.totalDistributed += amount;
    this.state.lastDistributionTimestamp = this.blockHeight;
    this.state.distributions.set(admin, { programId, amount, verified: true, timestamp: this.blockHeight, status: "executed" });
    const nextHistoryId = this.state.distributionHistory.size + 1;
    this.state.distributionHistory.set(nextHistoryId, { programId, amount, timestamp: this.blockHeight, admin });
    this.state.pendingRequests.delete(requestId);
    return { ok: true, value: true };
  }

  cancelPendingRequest(requestId: number): Result<boolean> {
    const request = this.state.pendingRequests.get(requestId);
    if (!request) return { ok: false, value: ERR_INVALID_PROGRAM_ID };
    if (this.caller !== request.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.pendingRequests.delete(requestId);
    return { ok: true, value: true };
  }

  getPoolBalance(): Result<number> {
    return { ok: true, value: this.state.poolBalance };
  }

  getDistribution(admin: string): Result<Distribution | undefined> {
    return { ok: true, value: this.state.distributions.get(admin) };
  }

  getPendingRequest(requestId: number): Result<PendingRequest | undefined> {
    return { ok: true, value: this.state.pendingRequests.get(requestId) };
  }

  getDistributionHistory(historyId: number): Result<DistributionHistory | undefined> {
    return { ok: true, value: this.state.distributionHistory.get(historyId) };
  }

  getTotalDistributed(): Result<number> {
    return { ok: true, value: this.state.totalDistributed };
  }

  getLastDistributionTimestamp(): Result<number> {
    return { ok: true, value: this.state.lastDistributionTimestamp };
  }

  isPoolPaused(): Result<boolean> {
    return { ok: true, value: this.state.isPaused };
  }
}

describe("DonationPool", () => {
  let contract: DonationPoolMock;

  beforeEach(() => {
    contract = new DonationPoolMock();
    contract.reset();
  });

  it("deposits successfully", () => {
    const result = contract.deposit(1000);
    expect(result.ok).toBe(true);
    expect(contract.state.poolBalance).toBe(1000);
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "contract" }]);
  });

  it("rejects request with invalid amount", () => {
    const result = contract.requestDistribution(1, 0, "STADMIN", 1, "STX", "SchoolA");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_AMOUNT);
  });

  it("rejects execute by non-admin", () => {
    contract.state.pendingRequests.set(1, { admin: "STADMIN", amount: 4750, programId: 1, timestamp: 0 });
    const result = contract.executeDistribution(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("cancels pending request successfully", () => {
    contract.state.pendingRequests.set(1, { admin: "ST1TEST", amount: 4750, programId: 1, timestamp: 0 });
    const result = contract.cancelPendingRequest(1);
    expect(result.ok).toBe(true);
    expect(contract.state.pendingRequests.has(1)).toBe(false);
  });

  it("rejects cancel by non-admin", () => {
    contract.state.pendingRequests.set(1, { admin: "STADMIN", amount: 4750, programId: 1, timestamp: 0 });
    const result = contract.cancelPendingRequest(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets fee rate successfully", () => {
    contract.caller = "ST1ADMIN";
    const result = contract.setDistributionFeeRate(8);
    expect(result.ok).toBe(true);
    expect(contract.state.distributionFeeRate).toBe(8);
  });

  it("rejects invalid fee rate", () => {
    contract.caller = "ST1ADMIN";
    const result = contract.setDistributionFeeRate(15);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_FEE_RATE);
  });

  it("adds allowed currency successfully", () => {
    contract.caller = "ST1ADMIN";
    const result = contract.addAllowedCurrency("BTC");
    expect(result.ok).toBe(true);
    expect(contract.state.allowedCurrencies.get("BTC")).toBe(true);
  });

  it("sets verification threshold successfully", () => {
    contract.caller = "ST1ADMIN";
    const result = contract.setVerificationThreshold(1, 75);
    expect(result.ok).toBe(true);
    expect(contract.state.verificationThresholds.get(1)).toBe(75);
  });

  it("rejects invalid threshold", () => {
    contract.caller = "ST1ADMIN";
    const result = contract.setVerificationThreshold(1, 150);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_THRESHOLD);
  });

  it("gets pool balance correctly", () => {
    contract.state.poolBalance = 5000;
    const result = contract.getPoolBalance();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(5000);
  });

  it("gets total distributed correctly", () => {
    contract.state.totalDistributed = 10000;
    const result = contract.getTotalDistributed();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(10000);
  });

  it("checks if paused correctly", () => {
    contract.state.isPaused = true;
    const result = contract.isPoolPaused();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
  });

  it("parses currency with Clarity", () => {
    const cv = stringAsciiCV("STX");
    expect(cv.value).toBe("STX");
  });
});