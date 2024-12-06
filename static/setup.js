const config = {
    deckCount: 2,
    dungeonRows: 3,
    dungeonColumns: 4,
    maxHealth: 15
};

const initEmptyDungeon = () => {
    return Array(config.dungeonRows).fill(undefined).map((_, row) => {
        return Array(config.dungeonColumns).fill(undefined).map((_, column) => {
            return {
                row,
                column,
                treasure: null,
                enemy: null,
                hasPlayer: false,
                isEntrance: false
            }
        })
    });
};

const initShuffledDeck = () => {
    const deck = [];

    for (let d = 1; d <= config.deckCount; d++) {
        for (let s in TSuit) {
            for (let r in TRank) {
                if (r === TRank.joker) {
                    continue;
                }
                deck.push({ rank: TRank[r], suit: TSuit[s], state: TCardState.back });
            }
        }
    }
    deck.push({ rank: TRank.joker, suit: TSuit.spades, state: TCardState.back });
    deck.push({ rank: TRank.joker, suit: TSuit.hearts, state: TCardState.back });

    for (let i = deck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
};

const initField = (dungeon, hand) => {
    for (let row in dungeon) {
        for (let col in dungeon[row]) {
            row = Number(row);
            col = Number(col);
            dungeon[row][col].treasure = hand.shift();
            dungeon[row][col].enemy = hand.shift();
            dungeon[row][col].isEntrance =
                row === 0 && col === 0
                || row === 0 && col === config.dungeonColumns - 1
                || row === config.dungeonRows - 1 && col === 0
                || row === config.dungeonRows - 1 && col === config.dungeonColumns - 1;
        }
    }

    return { dungeon, hand };
};

const initPlayer = () => {
    return {
        currentHealth: config.maxHealth,
        maxHealth: config.maxHealth,
        magic: 0,
        row: null,
        column: null
    };
};

const initLog = () => {
    return [
        message.game.welcome,
        message.game.selectEntrance
    ];
};

const initBag = () => {
    return {
        [TCardRole.artifact]: {
            [TSuit.hearts]: null,
            [TSuit.diamonds]: null,
            [TSuit.spades]: null,
            [TSuit.clubs]: null
        },
        [TCardRole.lifePotion]: [],
        gems: 0,
        [TCardRole.strengthPotion]: [],
        [TCardRole.magicPotion]: [],
        [TCardRole.prisoner]: []
    };
};

const initPlayerActionSelector = () => {
    return {
        choices: [],
        actions: {}
    };
};
