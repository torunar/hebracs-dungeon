// TODO: Merchant: trade
const getMerchantChoices = (chamber, state) => [
    {
        text: message.encounter.merchant.acceptTrade,
        callback: () => {
            console.debug('merchant.acceptTrade');
        }
    },
    {
        text: message.encounter.merchant.declineTrade,
        callback: () => {
            state.log.push(message.encounter.merchant.tradeDeclined);
            discardTreasure(chamber, state);
        }
    }
];

const getWhiteMagicPriestessChoices = (chamber, state) => [
    {
        text: message.encounter.whiteMagicPriestess.cureWounds,
        callback: () => {
            state.log.push(message.encounter.whiteMagicPriestess.woundsCured);
            state.player.currentHealth = addHealth(state.player, state.player.maxHealth);
            discardTreasure(chamber, state);
        }
    },
    {
        text: message.encounter.whiteMagicPriestess.takeTreasure,
        callback: () => {
            state.log.push(message.encounter.whiteMagicPriestess.treasureTaken);
        }
    }
];

// TODO: Adventurer: fight or trade
const getAdventurerChoices = (chamber, state) => [
    {
        text: message.encounter.adventurer.fight,
        callback: () => {
            console.debug('adventurer.fight');
        }
    },
    {
        text: message.encounter.adventurer.trade,
        callback: () => {
            console.debug('adventurer.trade');
        }
    }
];
