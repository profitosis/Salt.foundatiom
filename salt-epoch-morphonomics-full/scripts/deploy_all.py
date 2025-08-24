from brownie import accounts, SaltToken, SaltMorph, EpochManager, DripRoyalties, SaltBrickNFT

def main():
    acct = accounts.load("deployer")

    print("Deploying EpochManager...")
    epoch_manager = EpochManager.deploy(1_000_000, acct, {"from": acct})

    print("Deploying Salt Tokens...")
    salt1 = SaltToken.deploy("Salt1", "SALT1", 1_000_000, 1, acct, {"from": acct})
    salt2 = SaltToken.deploy("Salt2", "SALT2", 500_000, 2, acct, {"from": acct})

    print("Deploying SaltMorph...")
    morph = SaltMorph.deploy(epoch_manager.address, {"from": acct})
    morph.registerEpochToken(1, salt1.address, {"from": acct})
    morph.registerEpochToken(2, salt2.address, {"from": acct})

    print("Deploying DripRoyalties...")
    drip = DripRoyalties.deploy(salt1.address, {"from": acct})

    print("Deploying SaltBrickNFT...")
    brick = SaltBrickNFT.deploy("Giant Brick", "BRICK", {"from": acct})

    print("✅ All contracts deployed")
    return epoch_manager, salt1, salt2, morph, drip, brick