const suitName = {
    [TSuit.spades]: 'Spades',
    [TSuit.clubs]: 'Clubs',
    [TSuit.hearts]: 'Hearts',
    [TSuit.diamonds]: 'Diamonds'
};

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
        selectEntrance: 'Select where you wish to start your adventure.',
        copyright: 'Invented by <a href="https://www.pagat.com/invented/hebrac.html" target="_blank">Luc Miron</a>. Ported by <a href="https://github.com/torunar/hebracs-dungeon" target="_blank">torunar</a>',
    },
    encounter: {
        none: 'The chamber is not guarded. You can grab the treasure.',
        regularEnemy: ({ suit, rank }) => `You encounter ${enemyName[suit]} with ${rank} HP.`,
        blackMagicPriestess: {
            challenge: (card = null) => `You meet a black magic priestess! ${card ? message.encounter.blackMagicPriestess.steal(card) : message.encounter.blackMagicPriestess.empty}. You can grab the treasure she left behind in the chamber.`,
            challengeWithoutTreasure: (card = null) => `You meet a black magic priestess! ${card ? message.encounter.blackMagicPriestess.steal(card) : message.encounter.blackMagicPriestess.empty}.`,
            steal: ({rank, suit }) => `She steals a ${rank} of ${suit} from you and disappears`,
            empty: 'Your bag is empty, so she disappears disappointed',
        },
        merchant: {
            challenge: 'You encounter a merchant. Would you like to trade with him?',
            waresSold: 'You encounter a merchant, but he already sold his wares and stands here with a bag of gems.',
            acceptTrade: 'Accept trade',
            declineTrade: 'Decline trade',
            tradeDeclined: 'You decline the trade and the merchant disappears together with his wares.',
            buy: (price) => `Buy for ${price} gems`,
            steal: 'Steal (Stealing Spirit - 6 MP)',
            snatch: 'You use Stealing Spirit to snatch the treasure.',
            ignore: 'Ignore',
            decline: 'You decline to buy. The merchant disappears with the treasure.',
        },
        adventurer: {
            challenge: 'You meet a fellow adventurer. Would you like to fight them for their treasure or trade with them?',
            fight: 'Fight',
            trade: 'Trade',
            steal: 'Steal (Stealing Spirit - 6 MP)',
            snatch: 'You use Stealing Spirit to snatch the treasure.',
            refusal: 'This adventurer refuses to trade their treasure.',
            tradeSuccess: (value, { rank, suit }) => `You trade treasures of total value ${value} for the ${rank} of ${suit}.`,
            tradeFail: `You don't have enough value to trade.`,
            trick: 'Trick (Illusion - 4 MP)',
            trickSuccess: 'You use an Illusion spell to trick the adventurer into giving you their treasure.',
        },
        whiteMagicPriestess: {
            challenge: 'You meet a white magic priestess! Would you like to cure your wounds or take a treasure from her?',
            cureWounds: 'Cure wounds',
            takeTreasure: 'Take treasure',
            treasureTaken: `You've accepted the treasure from the priestess.`,
            woundsCured: 'Your wounds are fully cured.',
            woundsCuredWithTreasure: 'You meet a white magic priestess! Your wounds are fully cured.'
        },
        hebrac: {
            challenge: 'Hebrac himself appears in front of you! Would you like to gamble for the treasure?',
            accept: `Play Hebrac's game`,
            reject: `Refuse Hebrac's game`,
            rejectWithTreasure: 'You refuse to play. Hebrac disappears with the treasure.',
            enemyMove: ({ rank, suit }) => `Hebrac flips a ${suit === TSuit.diamonds || suit === TSuit.hearts ? 'red' : 'black'} card.`,
            win: 'You won! You get a treasure from your Hand Deck.',
            lose: (penalty) => `You lost! You lose ${penalty} life points and Hebrac disappears with the treasure.`,
        },
        genie: {
            treasure: `You meet Genie of Treasure! He gives you three treasures.`,
            life: (bonus) => `You meet Genie of Life! He increases your max HP by ${bonus}.`,
            death: (amount) => `You meet Genie of Death! He destroys ${amount} of your enemies.`,
            destiny: 'You meet Genie of Destiny! He casts the God Vision spell.',
        }
    },
    battle: {
        attack: ({ rank, suit }, total) => `You attack with ${rank} of ${suit} (Total: ${total})`,
        defeat: 'You defeated the enemy.',
        paralyzed: 'Enemy is paralyzed and cannot counter-attack.',
        damage: (damage) => `You take ${damage} damage.`,
    },
    spell: {
        remoteVision: {
            name: 'Remote Vision (1 MP)',
            cast: 'You use Remote Vision. All enemies revealed briefly.',
        },
        futurePerception: {
            name: 'Future Perception (1 MP)',
            cast: (amount) => `You can see the next ${amount} cards in your Hand Deck.`,
        },
        healing: {
            name: 'Healing (2 MP per HP)',
            cast: (amount) => `Healing spell restored ${amount} HP.`,
        },
        escape: {
            name: 'Escape (3 MP)',
            cast: 'You escaped.',
        },
        paralysis: {
            name: 'Paralysis (4 MP)',
            cast: 'Enemy paralyzed for 2 rounds.',
        },
        superStrength: {
            name: 'Super Strength (5 MP)',
            cast: 'Super Strength active for this battle.',
        },
        revelation: {
            name: 'Revelation (9 MP)',
            cast: 'Revelation spell reveals all enemies.',
        },
        godVision: {
            name: 'God Vision (15 MP)',
            cast: 'God Vision reveals everything.',
        },
    },
    gameLog: {
        nextLevel: 'You move to the next level of the dungeon.',
        nextLevelButton: 'Go to the next level',
        stealingSpirit: 'You use Stealing Spirit to snatch the gems.',
    },
    treasure: {
        found: (type, { suit, rank }) => `You get ${type} (${rank} of ${suit}).`,
        gems: ({ rank }) => `a bag of ${rank} gems`,
        lifePotion: ({ rank }) => `a ${rank} HP life potion`,
        strengthPotion: ({ rank }) => `a +${rank} strength potion`,
        magicPotion: ({ rank }) => `a ${rank} MP magic potion`,
        prisoner: `a prisoner`,
        artifact: 'an epic artifact',
        useless: 'You get a useless trinket. You discard it.',
        fakeArtifact: `You find something that may look like an artifact, but you already have this treasure! You discard the fake.`,
        rubyOfGaza: (bonus) => `Ruby of Gaza (+${bonus} max HP)`,
        bagOfMeres: `Bag of Meres (infinite gems)`,
        braceletOfAmok: `Bracelet of Armok (+3 strength in battles)`,
        scepterOfLeynos: `Scepter of Leynos (x2 magic points)`,
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
            addStrength: (x) => `Add ${x} strength to the next attack`,
            addStrengthDuringNextBattle: (x) => `Add ${x} strength during next battle`,
        }
    }
};
