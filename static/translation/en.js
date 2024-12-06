const enemyName = {
    [TSuit.spades]: 'a mercenary warrior',
    [TSuit.clubs]: 'an evil magician',
    [TSuit.hearts]: 'a warrior amazon',
    [TSuit.diamonds]: 'a demon'
};

const message = {
    entrance: {
        startHere: 'Enter here'
    },
    game: {
        title: `Hebrac's Dungeon`,
        welcome: 'Many entered, but few ever came out alive. Looking down from his sky palace, Hebrac, the legendary sorcerer, keeps on tempting mankind with the Dungeon that he created with his unrivaled magical powers. What adventures will you live through in the Dungeon?',
        selectEntrance: 'Select where you wish to start your adventure.'
    },
    encounter: {
        none: 'The chamber is not guarded. You grab the treasure.',
        regularEnemy: ({ suit, rank }) => `You encounter ${enemyName[suit]} with ${rank} HP.`,
        blackMagicPriestess: (card = null) => `You meet a black magic priestess! ${card ? 'She steals a valuable treasure from you and disappears' : 'Your bag is empty, so she disappears disappointed'}. You grab the treasure from the chamber.`,
        merchant: {
            challenge: 'You encounter a merchant. Would you like to trade with him?',
            waresSold: 'You encounter a merchant, but he already sold his wares and stands here with a bag of gems.',
            acceptTrade: 'Accept trade',
            declineTrade: 'Decline trade',
            tradeDeclined: 'You decline the trade and the merchant disappears together with his wares.',
        },
        adventurer: {
            challenge: 'You meet a fellow adventurer. Would you like to fight them for their treasure or trade with them?',
            fight: 'Fight',
            trade: 'Trade'
        },
        whiteMagicPriestess: {
            challenge: 'You meet a white magic priestess! Would you like to cure your wounds or take a treasure from her?',
            cureWounds: 'Cure wounds',
            takeTreasure: 'Take treasure',
            treasureTaken: `You've accepted the treasure from the priestess.`,
            woundsCured: 'Your wounds are fully cured.'
        },
        hebrac: {
            challenge: 'You encounter Hebrac himself! Would you like to gamble for the treasure?'
        }
    },
    treasure: {
        fakeArtifact: `You find something that may look like an artifact... But you already have this treasure! You dispose of the fake.`
    },
    bag: {
        infiniteGems: '∞',
        [TCardRole.artifact]: 'Epic artifacts',
        [TCardRole.lifePotion]: 'Life potions',
        [TCardRole.magicPotion]: 'Magic potions',
        [TCardRole.strengthPotion]: 'Strength potions',
        [TCardRole.prisoner]: 'Saved prisoners',
        action: {
            addGems: (x) => `Turn into ${x} gems`,
            addHealth: (x) => `Heal ${x} HP`,
            addMagic: (x) => `Add ${x} MP`,
        }
    }
};
