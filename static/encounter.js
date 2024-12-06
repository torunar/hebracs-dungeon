const getCardAttackValue = (card) => {
    switch (card.rank) {
        case TRank.king:
        case TRank.queen:
        case TRank.jack:
        case TRank.joker:
            return 10;
        case TRank.ace:
            return 1;
        default:
            return card.rank;
    }
};

const resolveBattle = (chamber, state) => {
    const enemyRank = getCardAttackValue(chamber.enemy);
    const attackCard = state.hand.shift();
    let playerAttack = getCardAttackValue(attackCard) + getStrengthBonus(state.player, state.bag);

    if (state.player.hasSuperStrength) {
        playerAttack *= 2;
    }

    state.log.push(message.battle.attack(attackCard, playerAttack));
    state.hand.push({ ...attackCard, state: TCardState.back });

    // strength bonus is reset after any attack
    state.player.strength = 0;

    if (playerAttack >= enemyRank) {
        state.log.push(message.battle.defeat);
        discardEnemy(chamber, state);
        state.player.hasActivePrisoner = false; // Prisoner leaves after battle
        state.player.hasSuperStrength = false;
        state.player.paralysisDuration = 0;
        state.player.isInFight = false;
        return;
    }

    if (state.player.paralysisDuration > 0) {
        state.log.push(message.battle.paralyzed);
        state.player.paralysisDuration--;
        return;
    }

    const damage = enemyRank - playerAttack;
    state.log.push(message.battle.damage(damage));
    state.player.currentHealth -= damage;
};

const getSpellChoices = (chamber, state, castCallback, renderCallback) => {
    const choices = [];

    if (state.player.magic >= 1) {
        choices.push({
            text: message.spell.remoteVision.name,
            callback: () => {
                state.player.magic -= 1;
                state.log.push(message.spell.remoteVision.cast);
                for (let row in state.dungeon) {
                    for (let col in state.dungeon[row]) {
                        if (state.dungeon[row][col].enemy?.state !== TCardState.back) {
                            continue;
                        }

                        state.dungeon[row][col].enemy.state = TCardState.face;
                        setTimeout(() => {
                            state.dungeon[row][col].enemy.state = TCardState.back;
                            renderCallback();
                        }, 2000);
                    }
                }
                castCallback();
            },
        });
        choices.push({
            text: message.spell.futurePerception.name,
            callback: () => {
                state.player.magic -= 1;
                for (let i = 0; i < config.futurePerceptionCardAmount; i++) {
                    state.hand[i].state = TCardState.face;
                }
                state.log.push(message.spell.futurePerception.cast(config.futurePerceptionCardAmount));
                castCallback();
            },
        });
    }
    if (state.player.magic >= 2) {
        choices.push({
            text: message.spell.healing.name,
            callback: () => {
                const healAmount = Math.floor(state.player.magic / 2);
                state.player.magic -= healAmount * 2;
                state.player.currentHealth = addHealth(state.player, healAmount);
                state.log.push(message.spell.healing.cast(healAmount));
                castCallback();
            },
        });
    }
    if (state.player.magic >= 3) {
        choices.push({
            text: message.spell.escape.name,
            callback: () => {
                state.player.magic -= 3;
                state.player.isInFight = false;
                state.log.push(message.spell.escape.cast);
            },
        });
    }
    if (state.player.magic >= 4) {
        choices.push({
            text: message.spell.paralysis.name,
            callback: () => {
                state.player.magic -= 4;
                state.player.paralysisDuration = 2;
                state.log.push(message.spell.paralysis.cast);
                castCallback();
            },
        });
        choices.push({
            text: message.spell.superStrength.name,
            callback: () => {
                state.player.magic -= 5;
                state.player.hasSuperStrength = true;
                state.log.push(message.spell.superStrength.cast);
                castCallback();
            },
        });
    }
    if (state.player.magic >= 9) {
        choices.push({
            text: message.spell.revelation.name,
            callback: () => {
                state.player.magic -= 9;
                state.log.push(message.spell.revelation.cast);
                for (let row in state.dungeon) {
                    for (let col in state.dungeon[row]) {
                        if (state.dungeon[row][col].enemy) {
                            state.dungeon[row][col].enemy.state = TCardState.face;
                        }
                    }
                }
                castCallback();
            },
        });
    }
    if (state.player.magic >= 15) {
        choices.push({
            text: message.spell.godVision.name,
            callback: () => {
                state.player.magic -= 15;
                state.log.push(message.spell.godVision.cast);
                castGodVision(state);
                castCallback();
            },
        });
    }

    return choices;
};

const getEnemyChoices = (chamber, state, renderCallback) => {
    const enemyActionCallback = () => {
        if (chamber.enemy === null) {
            return;
        }

        setPlayerActionSelector(getEnemyChoices(chamber, state, renderCallback), state.actionSelector);
    };

    const choices = [
        {
            text: 'Attack',
            callback: () => {
                resolveBattle(chamber, state);
                enemyActionCallback();
            },
        },
    ];
    choices.push(...getSpellChoices(chamber, state, enemyActionCallback, renderCallback));

    return choices;
};

const getMerchantChoices = (chamber, state, hasItemsToSell) => {
    const choices = [];
    const price = getBaseTreasureValue(chamber.treasure);
    const gemCount = getGemCount(state.bag)

    if (hasItemsToSell && gemCount > price) {
        choices.push({
            text: message.encounter.merchant.buy(price),
            callback: () => {
                if (isFinite(gemCount)) {
                    state.bag.gems -= price;
                }
                discardEnemy(chamber, state);
                retrieveTreasure(chamber, state);
            },
        });
    }

    if (state.player.magic >= 6) {
        choices.push({
            text: message.encounter.merchant.steal,
            callback: () => {
                state.player.magic -= 6;
                state.log.push(message.encounter.merchant.snatch);
                discardEnemy(chamber, state);
                retrieveTreasure(chamber, state);
            },
        });
    }

    choices.push({
        text: message.encounter.merchant.ignore,
        callback: () => {
            state.log.push(message.encounter.merchant.decline);
            discardEnemy(chamber, state);
            discardTreasure(chamber, state);
        },
    });

    return choices;
};

const getWhiteMagicPriestessChoices = (chamber, state) => [
    {
        text: message.encounter.whiteMagicPriestess.cureWounds,
        callback: () => {
            state.log.push(message.encounter.whiteMagicPriestess.woundsCured);
            state.player.currentHealth = addHealth(state.player, state.player.maxHealth);
            discardEnemy(chamber, state);
            discardTreasure(chamber, state);
        },
    },
    {
        text: message.encounter.whiteMagicPriestess.takeTreasure,
        callback: () => {
            state.log.push(message.encounter.whiteMagicPriestess.treasureTaken);
            discardEnemy(chamber, state);
            retrieveTreasure(chamber, state);
        },
    },
];

const getAdventurerChoices = (chamber, state, renderCallback) => {
    const choices = [
        {
            text: message.encounter.adventurer.fight,
            callback: () => {
                state.player.isInFight = true;
                setPlayerActionSelector(getEnemyChoices(chamber, state, renderCallback), state.actionSelector);
            },
        },
    ];

    const treasure = chamber.treasure;
    if (!treasure) {
        return choices;
    }

    if (state.player.magic >= 6) {
        choices.push({
            text: message.encounter.adventurer.steal,
            callback: () => {
                state.player.magic -= 6;
                state.log.push(message.encounter.adventurer.snatch);
                retrieveTreasure(chamber, state);
            },
        });
    }

    const canTrade = treasure.rank !== TRank.ace
        && !(treasure.rank === TRank.queen && [TSuit.spades, TSuit.clubs].includes(treasure.suit));

    if (canTrade) {
        choices.push({
            text: message.encounter.adventurer.trade,
            callback: () => {
                const requiredValue = getBaseTreasureValue(treasure);
                const playerValue = calculateInventoryValue(state);

                if (playerValue >= requiredValue) {
                    state.log.push(message.encounter.adventurer.tradeSuccess(requiredValue, treasure));
                    payFromInventory(state, requiredValue);
                    discardEnemy(chamber, state);
                } else {
                    state.log.push(message.encounter.adventurer.tradeFail);
                }
            },
        });

        if (state.player.magic >= 4) {
            choices.push({
                text: message.encounter.adventurer.trick,
                callback: () => {
                    state.player.magic -= 4;
                    state.log.push(message.encounter.adventurer.trickSuccess);
                    discardEnemy(chamber, state);
                    retrieveTreasure(chamber, state);
                },
            });
        }
    } else {
        state.log.push(message.encounter.adventurer.refusal);
    }

    return choices;
};

const resolveHebrac = (chamber, state) => {
    state.log.push(message.encounter.hebrac.challenge);
    setPlayerActionSelector([
        {
            text: message.encounter.hebrac.accept,
            callback: () => {
                const card = state.hand.shift();
                state.log.push(message.encounter.hebrac.enemyMove(card));
                if ([TSuit.hearts, TSuit.diamonds].includes(card.suit)) {
                    state.log.push(message.encounter.hebrac.win);
                    const treasure = chamber.treasure ?? state.hand.shift();
                    retrieveTreasure({ ...chamber, treasure }, state);
                } else {
                    state.log.push(message.encounter.hebrac.lose(config.hebracGameHealthPenalty));
                    state.player.currentHealth -= config.hebracGameHealthPenalty;
                }
                state.hand.push({ ...card, state: TCardState.back });

                discardEnemy(chamber, state);
                discardTreasure(chamber, state);
            },
        },
        {
            text: message.encounter.hebrac.reject,
            callback: () => {
                state.log.push(message.encounter.hebrac.rejectWithTreasure);
                discardEnemy(chamber, state);
                discardTreasure(chamber, state);
            },
        },
    ], state.actionSelector);
};

const castGodVision = (state) => {
    for (let row in state.dungeon) {
        for (let col in state.dungeon[row]) {
            if (!state.dungeon[row][col].enemy && !state.dungeon[row][col].treasure) {
                continue;
            }
            (state.dungeon[row][col].enemy ?? state.dungeon[row][col].treasure).state = TCardState.face;
        }
    }
};
