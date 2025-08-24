from brownie import accounts, SaltToken, EpochManager, SaltMorph, DripRoyalties
def main():
    acct = accounts.load("deployer")
    epoch_manager = EpochManager.deploy(1000000, acct, {"from": acct})
    salt1 = SaltToken.deploy("Salt1", "SALT1", 1000000, 1, acct, {"from": acct})
    salt2 = SaltToken.deploy("Salt2", "SALT2", 500000, 2, acct, {"from": acct})
    morph = SaltMorph.deploy(epoch_manager.address, {"from": acct})
    morph.registerEpochToken(1, salt1.address, {"from": acct})
    morph.registerEpochToken(2, salt2.address, {"from": acct})
    drip = DripRoyalties.deploy(salt1.address, {"from": acct})
    print("✅ Deployment complete")