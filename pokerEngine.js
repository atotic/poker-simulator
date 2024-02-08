"use strict"
var PokerEngine = (function () {
  /*
    Input:
  
    - game setup
      - cards per player
      - number of players
      - winning: hilo, best hand
      - visible players
  
    - play
      - player's hand
      - flop
      - turn
      - river
  
  
    Output
    - total winning odds
      - game stats: 
  Inspired by:
  https://www.omnicalculator.com/other/poker-odds
  Probability breakdown:
  You win: 55% ← your equity
  You tie: 4%
  You lose: 41%
  Rank breakdown:
  Rank	You	Opponents
  Straight Flush	0%	0%
  Four of a Kind	<0.5%	<0.5%
  Full House	2%	2%
  Flush	2%	3%
  Straight	4%	4%
  Three of a Kind	4%	6%
  Two Pair	23%	25%
  Pair	46%	42%
  High Card	19%	17%
  
  Poker terms
  https://en.wikipedia.org/wiki/Glossary_of_poker_terms
  */
  class PokerEngine {
    holeCardCount = 2;
    holeCardRules = 'exactly2'; // exactly2 | atMost2
    playerCount = 10;
    communityCardCount = 5;
    scoring = 'high';	// high | highlow

    static CardRank = new Map([
      ["a", 1],
      ["2", 2],
      ["3", 3],
      ["4", 4],
      ["5", 5],
      ["6", 6],
      ["7", 7],
      ["8", 8],
      ["9", 9],
      ["T", 10],
      ["J", 11],
      ["Q", 12],
      ["K", 13],
      ["A", 14]
    ]);

    static Suits = ["S", "H", "D", "C"];

    static HandRank = new Map([
      ['highCard', 1],
      ['pair', 2],
      ['twoPairs', 3],
      ['trips', 4],
      ['straight', 5],
      ['flush', 6],
      ['fullHouse', 7],
      ['quads', 8],
      ['straightFlush', 9] // royalFlush is just top straightFlush
    ]);

    // -1: a < b
    //  1: a > b
    static compareRank(a, b) {
      if (a === undefined)
        if (b === undefined)
          throw "Comparing two undefined cards!";
        else
          return -1;
      if (b === undefined)
        return 1;
      let aRank = PokerEngine.CardRank.get(a[0]);
      let bRank = PokerEngine.CardRank.get(b[0]);
      if (aRank > bRank)
        return 1;
      if (bRank > aRank)
        return -1;
      if (aRank == bRank)
        return 0;
    }

    static compareStraights(a, b) {
      return PokerEngine.compareRank(a.at(-1), b.at(-1));
    }

    static compareHighHands(a, b) {
      if (a === undefined) {
        if (b === undefined)
          return 0;
        else
          return -1;
      } else if (b === undefined) {
        return 1;
      }
      let aHandRank = PokerEngine.HandRank.get(a.type);
      let bHandRank = PokerEngine.HandRank.get(b.type);
      if (aHandRank< bHandRank)
        return -1;
      if (aHandRank > bHandRank)
        return 1;
      // handRank is equal
      // Straight is special case, compare rank of highest card
      if (a.type == 'straight')
        return PokerEngine.compareStraights(a.cards, b.cards);
      for (let i=0; i<a.cards.length; ++i) {
        let cmp = PokerEngine.compareRank(a.cards[i], b.cards[i]);
        if (cmp != 0)
          return cmp;
      }
      return 0;
    }

    static compareLowHands(a, b) {
      if (a == null) {
        if (b == null)
          return 0;
        return -1;
      } 
      if (b == null)
        return 1;
      for (let i=4; i >= 0; --i) {
        let aRank = PokerEngine.CardRank.get(a[i][0]);
        let bRank = PokerEngine.CardRank.get(b[i][0]);
        if (a[i] == 'A')
          aRank = PokerEngine.CardRank.get('a');
        if (b[i] == 'A')
          bRank = PokerEngine.CardRank.get('a');
        if (aRank < bRank)
          return 1;
        if (bRank < aRank)
          return -1;
      }
      return 0;
    }

    static nextCardForStraight(prev, next) {
      if (prev[0] == 'A' && next[0] == '2')
        return true;
      if ((PokerEngine.CardRank.get(prev[0]) + 1) == PokerEngine.CardRank.get(next[0]))
        return true;
      return false;
    }

    static countHoleCards(cardArry) {
      return cardArry.reduce((acc, v) => v.endsWith('+') ? acc + 1 : acc, 0);
    }

    static isHole(c) {
      return c[2] == '+';
    }

    static isLowCard(c) {
      return PokerEngine.CardRank.get(c[0]) <= 8 || c[0] == 'A';
    }
    // Removes duplicates from an array. Returns list of duplicates.
    static eliminateDuplicateRank(arry) {
      let dupes = [];
      for (let i=0; i<arry.length; ++i) {
        let dup = arry.findLastIndex(c => c[0] == arry[i][0]);
        if (dup != i) {
          dupes.push(arry[dup]);
          arry.splice(dup, 1);
          --i;
        }
      }
      return dupes;
    }

    constructor(options) {
      if (!options)
        return;
      if (options.holeCardCount) {
        if (options.holeCardCount < 1 || options.holeCardCount > 5)
          throw `holeCardCount (${options.holeCardCount} out of bounds)`;
        this.holeCardCount = options.holeCardCount;
      }
      if (options.playerCount) {
        if (options.playerCount < 2 || options.playerCount > 15)
          throw `playerCount (${options.playerCount} out of bounds)`;
        this.playerCount = parseInt(options.playerCount);
      }
      if (options.holeCardRules) {
        if (!['exactly2', 'atMost2'].includes(options.holeCardRules))
          throw `holeCardRules (${options.holeCardRules} out of bounds)`;
        this.holeCardRules = options.holeCardRules;
      }
      if (options.scoring) {
        if (!['high', 'highlow'].includes(options.scoring))
          throw `illegal scoring value (${options.scoring})`;
        this.scoring = options.scoring;
      }
    }

    // Deck is an array of 52 cards
    makeDeck() {
      let deck = [];
      for (let s of PokerEngine.Suits) {
        for (let r of PokerEngine.CardRank.keys()) {
          if (r != 'a')
            deck.push(r + s);
        }
      }
      if (deck.length != 52)
        throw `deck does not have 52 cards, ${deck.length}`;
      return deck;
    }

    shuffle(deck) {
      let rands = new Map(); // card => random
      for (let c of deck)
        rands[c] = Math.random();
      deck.sort((a, b) => {
        if (rands[a] < rands[b])
          return -1;
        if (rands[a] > rands[b])
          return 1;
        return 0;
      });
      return deck;
    }

    removeCard(deck, card) {
      let loc = deck.indexOf(card);
      if (loc == -1)
        throw `Could not remove card ${card} from deck. ${allHoleCards}`;
      deck.splice(deck.indexOf(card), 1);
    }

    // Scores low hand for a single player.
    // Returns array of cards, or null if no low
    scoreLowHand(communityCards, holeCards) {
      // Aces are ranked as 1 in low hands
      let convertAceToLow = c => {
        return c.replace("A", "a");
      }
      let convertAceToHigh = c => {
        return c.replace("a", "A");
      }
      communityCards = communityCards.map(convertAceToLow);
      holeCards = holeCards.map(convertAceToLow);
      if (this.holeCardRules != 'exactly2')
        throw "Low hand can only be scored with exactly 2 cards";
      let lowHoleCards = holeCards.filter(PokerEngine.isLowCard);
      PokerEngine.eliminateDuplicateRank(lowHoleCards);
      if (lowHoleCards.length < 2)
        return null;
      let lowCommunityCards = communityCards.filter(PokerEngine.isLowCard);
      PokerEngine.eliminateDuplicateRank(lowCommunityCards);
      let allLowCards = [...lowHoleCards, ...lowCommunityCards];
      if (allLowCards.length < 5)
        return null;
      let communityDupes = new Map(); // Map of community cards that duplicate hole cards
      for (let d of PokerEngine.eliminateDuplicateRank(allLowCards)) {
        if (!PokerEngine.isHole(d))
          communityDupes.set(d[0], d);
      }
      allLowCards.sort(PokerEngine.compareRank);
      
      // bestLowHand contains maximum amount of hole cards.
      let bestLowHand = allLowCards.slice(0,5);
      // console.log(bestLowHand);
      
      let holeCardCount = PokerEngine.countHoleCards(bestLowHand);
      if (holeCardCount > 2) {
        // Modify hand by swapping hole cards with community cards if possible
        for (let i=0; i<bestLowHand.length && holeCardCount > 2; ++i) {
          if (PokerEngine.isHole(bestLowHand[i]) && communityDupes.has(bestLowHand[i][0])) {
            let communitySwap = communityCards.findIndex( c => c[0] == bestLowHand[i][0]);
            bestLowHand[i] = communityCards[communitySwap];
            holeCardCount--;
          }
        }
      }
      if (holeCardCount > 2) {
        // Swap unused cards if possible
        for (let i=5; i<allLowCards.length && holeCardCount > 2; ++i) {
          let hasDupe = communityDupes.has(allLowCards[i][0]);
          if (!PokerEngine.isHole(allLowCards[i]) || hasDupe) {
            let swapCard = '';
            if (hasDupe) {
              swapCard = communityCards.find(c => c[0] == allLowCards[i][0]);
            } else {
              swapCard = allLowCards[i];
            }
            let highestHoleIndex = bestLowHand.findLastIndex(PokerEngine.isHole);
            bestLowHand[highestHoleIndex] = swapCard;
            holeCardCount--;
          }
        }
        if (holeCardCount == 2)
          bestLowHand.sort(PokerEngine.compareRank);
      }
      if (holeCardCount > 2)
        return null;
      if (holeCardCount < 2) {
        // Try to find extra holes in unused cards if possible
        for (let i=5; i<allLowCards.length && holeCardCount < 2; ++i) {
          if (PokerEngine.isHole((allLowCards[i]))) {
            // swap highest non-hole card.
            let highestCommunityIndex = bestLowHand.findLastIndex(c => !PokerEngine.isHole(c));
            bestLowHand[highestCommunityIndex] = allLowCards[i];
            holeCardCount++;
          }
        }
      }
      if (bestLowHand.length != 5 || holeCardCount != 2)
        return null;
      return bestLowHand.map(convertAceToHigh);
    }

    // Makes a high card hand
    makeHandHighCard(communityCards, holeCards) {
      let madeHand = [];
      let holeCardsUsed = 0;
      let nextCommunity = communityCards.length - 1;
      let nextHole = holeCards.length - 1;
      while (madeHand.length < 5) {
        let communityPick = undefined;
        let holePick = undefined;
        let holeCardsNeeded = this.holeCardRules == 'atMost2' ? 0 : 2 - holeCardsUsed;
        // pick community card if allowed
        if (nextCommunity >= 0 // cards remain
          && (madeHand.length + holeCardsNeeded) < 5) {
          communityPick = communityCards[nextCommunity];
        }
        if (holeCardsUsed < 2)
          holePick = holeCards[nextHole];

        let compare = PokerEngine.compareRank(communityPick, holePick);
        if (compare == 1) {
          madeHand.push(communityPick);
          nextCommunity--;
        } else {
          madeHand.push(holePick);
          nextHole--;
          holeCardsUsed++;
        }
      }
      if (holeCardsUsed > 2)
        throw `Used too many hole cards ${holeCardsUsed}`;
      if (this.holeCardRules == 'exactly2' && holeCardsUsed != 2)
        throw `Did not use exactly 2 hole cards ${holeCardsUsed}`;
      return madeHand;
    }

    /* Scoring algorithm
    - count rank
      - at most 2 hole
        - count hole, with max 2
        - count community
    - count suit, at most 2 community
      - at most 2 hole
        - count hole, with max 2
        - count community
    - enumerate all straights
      - mix all cards together, sort.
        - keep all possibilities
          - look at new card
            - if possibilities are empty, add card to possibilities
            - if possibilities are full
              if card equals possibility, split all
              if card next, extend all
              else clear possibilities.
        - clear out any possibilities that are not "exactly 2", or "at most 2"
    
    best hand: type, cards.
    player can have 2/3/4 cards.
    */

    // Returns array of all possible straights in descending order
    computeAllPossibleStraights(communityCards, holeCards) {
      let straights = [];
      // allCards are ascending
      let allCards = new Array(...communityCards, ...holeCards).sort((a, b) => PokerEngine.compareRank(a, b));
      if (allCards.at(-1)[0] == 'A') {
        // Duplicate aces to the front
        let aces = [];
        let i = -1;
        while (allCards.at(i)[0] == 'A') {
          aces.push(allCards.at(i--));
        }
        allCards.unshift(...aces);
      }
      for (let card of allCards) {
        if (straights.length == 0) {
          straights.push([card]);
        } else {
          if (card[0] == straights[0].at(-1)[0]) {
            // same rank, multiple straights possible, split
            let newStraights = [];
            for (let s of straights) {
              newStraights.push(s);
              let withNewCard = Array.from(s);
              withNewCard.pop();
              withNewCard.push(card);
              newStraights.push(withNewCard);
            }
            straights = newStraights;
          } else if (PokerEngine.nextCardForStraight(straights[0].at(-1), card)) {
            // consecutive card, extend all
            for (let s of straights)
              s.push(card);
          } else {
            // not next card, clear all if straight has not been made.
            if (straights[0].length < 5)
              straights = [[card]];
          }
        }
      }
      if (straights.length > 0 && straights[0].length < 5)
        straights = [];
      // At this point, straights can be longer than 5 cards. 
      // Transform long straights into 5-length straights
      if (straights.some(s => s.length > 5)) {
        let newStraights = [];
        for (let s of straights) {
          if (s.length == 5) {
            newStraights.push(s);
          } else {
            // split into 5 card straights
            let i = 0;
            while (i + 5 <= s.length) {
              newStraights.push(s.slice(i, i + 5));
              i++;
            }
          }
        }
        // Eliminate duplicate straights
        straights = newStraights.filter(
          (straightArray, straightIndex) => {
            let otherIndex = newStraights.findIndex(otherStraightArray => {
              for (let i = 0; i < otherStraightArray.length; ++i) {
                if (otherStraightArray[i] != straightArray[i])
                  return false;
              }
              return true;
            });
            return otherIndex == straightIndex;
          });

      }
      // Eliminate straights that don't have the right number of hole cards
      switch (this.holeCardRules) {
        case 'exactly2':
          for (let i = 0; i < straights.length; i++) {
            if (PokerEngine.countHoleCards(straights[i]) != 2)
              straights.splice(i--, 1)
          }
          break;
        case 'atMost2':
          for (let i = 0; i < straights.length; i++) {
            if (PokerEngine.countHoleCards(straights[i]) > 2)
              straights.splice(i--, 1)
          }
          break;
      }
      straights.sort((a, b) => PokerEngine.compareStraights(b, a));
      return straights;
    }

    // Scores high hand for a single player
    // Returns best hand: {
    //  type: see HandRank map
    //  cards: [ 5 cards]
    scoreHighHand(communityCards, holeCards) {
      // count rank
      let rankCount = new Map(Array.from(PokerEngine.CardRank.keys()).map(k => [k, 0]));
      for (let c of holeCards)
        rankCount.set(c[0], rankCount.get(c[0]) + 1);
      let MaxHoleCards = 2;
      // count at most 2 cards from hole. T T T T in the hole counts only as 2
      for (let r of rankCount) { 
        if (r[1] > MaxHoleCards)
          rankCount.set(r[0], MaxHoleCards);
      }
      for (let c of communityCards)
        rankCount.set(c[0], rankCount.get(c[0]) + 1);

      // count suits. 
      let suitCount = new Map(PokerEngine.Suits.map(k => [k, 0]));
      for (let c of holeCards)
        suitCount.set(c[1], suitCount.get(c[1]) + 1);
      // Hole contributes at most 2
      for (let s of suitCount)
        if (s[1] > 2)
          suitCount.set(s[0], 2);
      for (let c of communityCards)
        suitCount.set(c[1], suitCount.get(c[1]) + 1);

      // compute straights
      let straights = this.computeAllPossibleStraights(communityCards, holeCards);

      let pairs = []; // ascending order
      let trips = [];
      let quads = [];
      for (let r of rankCount) {
        switch (r[1]) {
          case 4:
            quads.push(r[0]);
          // fall through
          case 3:
            trips.push(r[0]);
          // fall through
          case 2:
            pairs.push(r[0]);
            break;
          default:
            break;
        }
      }

      let allCards = new Array(...communityCards, ...holeCards).sort((a, b) => PokerEngine.compareRank(a, b));

      // Utility functions
  
      // returns true if card was removed
      let removeHoleCard = cards => {
        for (let i = 0; i < cards.length; ++i) {
          if (PokerEngine.isHole(cards[i])) {
            cards.splice(i, 1);
            return true;
          }
        }
        return false;
      }

      // returns true if card was removed
      let removeCommunityCard = cards => {
        for (let i = 0; i < cards.length; ++i) {
          if (!PokerEngine.isHole(cards[i])) {
            cards.splice(i, 1);
            return true;
          }
        }
        return false;
      }

      // Fills to 5 cards, ensuring hole rules work.
      // Returns filled cards array, or undefined if cannot fill
      let fillWithHighCards = cards => {
        if (cards.length == 5)
          return;
        let holeCount = cards.filter(c => PokerEngine.isHole(c)).length;
        if (holeCount > 2) {
          // console.warn(`could not fillWithHighCards ${cards}`);
          return undefined;
        }
        switch (this.holeCardRules) {
          case 'atMost2': {
            let i = -1;
            while (cards.length < 5) {
              let c = allCards.at(i--);
              if (c == undefined)
                break;
              let isHole = PokerEngine.isHole(c);
              if (cards.indexOf(c) == -1 && (holeCount < 2 || !isHole)) {
                cards.push(c);
                if (isHole)
                  ++holeCount;
              }
            }
          }
            break;
          case 'exactly2': {
            if ((cards.length + 2 - holeCount) > 5) {
              // console.log(`Cannot fill in 2 holes, not enough empty slots ${cards}`);
              return null;
            }
            let i = -1;
            while (holeCount < 2) {
              let c = holeCards.at(i--);
              if (cards.indexOf(c) == -1) {
                cards.push(c);
                holeCount++
              }
            }
            i = -1;
            while (cards.length < 5) {
              let c = communityCards.at(i--);
              if (c == undefined)
                break;
              if (cards.indexOf(c) == -1)
                cards.push(c);
            }
          }
            break;
        }
        if (cards.length != 5) {
          console.warn(`Could not fill ${cards} with ${allCards}`);
          throw `Could not fill ${cards} with ${allCards}`;
        }
        return cards;
      }

      // Find best possible hand

      // Straight flush
      let hasFlush = false;
      for (let v of suitCount.values()) {
        if (v >= 5) {
          hasFlush = true;
          break;
        }
      }
      if (hasFlush && straights.length > 0) {
        for (let s of straights) {
          let suit = s[0][1];
          if (!s.some(c => c[1] != suit)) {
            return {
              type: 'straightFlush',
              cards: s
            };
          }
        }
      }

      // Quads
      if (quads.length > 0) {
        let bestQuad = quads.at(-1);
        let cards = new Array(...holeCards, ...communityCards).filter(c => c[0] == bestQuad);
        cards = fillWithHighCards(cards);
        if (cards)
          return {type: 'quads', cards: cards};
      }

      //  Full house
      for (let t = trips.length - 1; t >= 0; --t) {
        for (let p = pairs.length - 1; p >= 0; --p) {
          if (pairs[p] == trips[t])
            continue;
          // Have a trip + pair
          let tripCards = [];
          let pairCards = [];
          let holeCount = 0;
          for (let c of allCards) {
            if (c[0] == trips[t]) {
              tripCards.push(c);
              if (c[2] == "+")
                holeCount++;
            }
            else if (c[0] == pairs[p]) {
              pairCards.push(c);
              if (c[2] == "+")
                holeCount++;
            }
          }
          if (this.holeCardRules == 'exactly2') {
            // make sure we have exactly 2 hole cards
            switch (holeCount) {
              case 0:
              case 1:
                continue;
              case 2:
                if (pairCards.length > 2) {
                  // Corner case, 3 pair cards, need to discard one that is not a hole
                  if (PokerEngine.isHole(pairCards.at(-1)))
                    pairCards.shift();
                  else
                    pairCards.pop();
                }
                break;
              case 3:
                // Discard pair cards if possible
                if (pairCards.length == 2)
                  continue;
                let holeIndex = pairCards.findIndex(PokerEngine.isHole);
                if (holeIndex != -1)
                  pairCards.splice(holeIndex, 1);
                else
                  continue;
              case 4:
              case 5:
                // No way to discard 2 hole cards, because we'll never have quad pairs.
                continue;
              default:
                throw `Unexpected number of hole cards ${holeCount}`;
            }
          }
          if (pairCards.length > 2)
            pairCards.pop();
          return {
            type: 'fullHouse',
            cards: new Array(...tripCards, ...pairCards)
          };
        } // for pairs
      } // for trips

      // Flush
      if (hasFlush) {
        let flushSuit = "";
        for (let s of suitCount)
          if (s[1] >= 5)
            flushSuit = s[0];
        let flushCards = allCards.filter(c => c[1] == flushSuit);
        if (!(flushCards.length >= 5))
          throw "hasFlush, but no flush";
        let found = true;;
        if (this.holeCardRules == 'exactly2') {
          let holeCount = PokerEngine.countHoleCards(flushCards);
          switch (holeCount) {
            case 0:
            case 1:
              found = false;
              break;
            case 2:
              // Remove extra non-hole cards to make length exactly 5
              if (flushCards.length > 5) {
                while (flushCards.length != 5)
                  removeCommunityCard(flushCards);
              }
              break;
            case 3:
              // Remove extra hole card, then remove non-hole cards to make length exactly 5
              removeHoleCard(flushCards);
              while (flushCards.length > 5)
                removeCommunityCard(flushCards);
              break;
            case 4:
              removeHoleCard(flushCards);
              removeHoleCard(flushCards);
              while (flushCards.length > 5)
                removeCommunityCard(flushCards);
              break;
          }
        } else {
          while (flushCards.length > 5)
            flushCards.shift();
        }
        if (found) {
          return {
            type: 'flush',
            cards: flushCards
          }
        }
      }

      // Straight
      if (straights.length > 0) {
        return {
          type: 'straight',
          cards: straights[0]
        }
      }

      // Trips
      if (trips.length > 0) {
        let tripRank = trips.at(-1);
        let cards = allCards.filter(c => c[0] == tripRank);
        if (cards.length == 4) // Happens when all 3+ cards are in the hole
          removeHoleCard(cards);
        if (cards.length == 4)
          removeCommunityCard(cards);
        if (cards.length != 3) {
          throw `Unexpected cards for trips ${cards}`;
        }
        cards = fillWithHighCards(cards);
        if (cards)
          return { type: 'trips', cards: cards };
      }

      // Two pair
      if (pairs.length >= 2) {
        for (let first = pairs.length - 1; first >= 0; --first) {
          for (let second = pairs.length - 2; second >= 0; --second) {
            if (first == second)
              continue;
            let first_cards = allCards.filter(c => c[0] == pairs[first]);
            let second_cards = allCards.filter(c => c[0] == pairs[second]);
            first_cards.splice(2,2);
            second_cards.splice(2,2);
            let cards =  new Array(...first_cards, ...second_cards);
            cards = fillWithHighCards(cards);
            if (cards)
              return {type: 'twoPairs', cards: cards};
          }
        }
      }
      // Pair
      if (pairs.length > 0) {
        let cards = allCards.filter(c => c[0] == pairs[pairs.length - 1]);
        cards.splice(2,2);
        cards = fillWithHighCards(cards);
        if (cards)
          return { type: 'pair', cards: cards };
      }
      // High card
      let cards = [];
      cards = fillWithHighCards(cards);
      if (!cards)
        throw `Could not create high cards ${allCards}`;
      return { type: 'highCard', cards: cards }
    }

    // playerCards are cards for all players string[][]
    playGame(allPlayerCards = [[]], communityCards = [], activePlayers=[]) {
      if (!Array.isArray(activePlayers))
        throw `activePlayers must be an array of player indexes. ${activePlayers}`;
      if (allPlayerCards.length > 0 && allPlayerCards[0].length > 0
        && typeof allPlayerCards[0] == 'string') {
        // if we just passed in first player cards.
        allPlayerCards = [allPlayerCards];
      }
      let me = this;
      if (allPlayerCards.some(c => c.length > me.holeCardCount))
        throw `Too many cards ${allPlayerCards}`;
      if (communityCards.length > this.communityCardCount)
        throw `Too many community cards ${communityCards}`;

      let deck = this.shuffle(this.makeDeck());
      // Remove all pre-set cards from the deck
      for (let hand of allPlayerCards) {
        for (let c of hand) {
          this.removeCard(deck, c);
        }
      }
      for (let c of communityCards) {
        this.removeCard(deck, c);
      }

      let cardsNeeded = this.playerCount * this.holeCardCount + 5;
      if (cardsNeeded > 52) {
        throw `Not enough cards. ${cardsNeeded} cards are needed for ${this.playerCount} players, ${this.holeCardCount} cards each.`;
      }
      // Deal initialization
      // allHoleCards: pocket cards for all the players string[][]
      let allHoleCards = (new Array(this.playerCount)).fill(0).map(_ => new Array());
      for (let i = 0; i < allPlayerCards.length; ++i) {
        for (let card of allPlayerCards[i]) {
          allHoleCards[i].push(card);
        }
      }

      // Deal all the players
      for (let p of allHoleCards) {
        while (this.holeCardCount > p.length)
          p.push(deck.shift());
      }
      let allCommunityCards = [...communityCards];
      while (this.communityCardCount > allCommunityCards.length)
        allCommunityCards.push(deck.shift());

      // Sort high to low
      allCommunityCards = allCommunityCards.sort((a, b) => PokerEngine.compareRank(b, a));
      for (let i = 0; i < allHoleCards.length; ++i) {
        allHoleCards[i].sort((a, b) => PokerEngine.compareRank(b, a));
        // mark the hole cards with an extra '+' 
        allHoleCards[i] = allHoleCards[i].map(c => `${c}+`);
      }
      // Find best possible hand for all the players.
      let bestHands = [];
      for (let i=0; i<allHoleCards.length; ++i) {
        let score = {
          player: i,
          hole: allHoleCards[i],
          bestHighHand: this.scoreHighHand(allCommunityCards, allHoleCards[i])
        }
        if (this.scoring == 'highlow') {
          score.bestLowHand = this.scoreLowHand(allCommunityCards, allHoleCards[i]);
        }
        if (activePlayers.length > 0 && activePlayers.indexOf(i) == -1) {
          // Inactive players do not count
          // console.log("kicked off inactive player");
          score.bestHighHand = undefined;
          score.bestLowHand = undefined;
        }
        bestHands.push(score);
      }

      // Find high winners
      bestHands.sort((a,b) => {
        return PokerEngine.compareHighHands(b.bestHighHand, a.bestHighHand);
      });
      let winningHighHand = bestHands[0].bestHighHand;
      let i = 0;
      let highWinners = [];
      while (i < bestHands.length && PokerEngine.compareHighHands(winningHighHand, bestHands[i].bestHighHand) == 0)
        highWinners.push(bestHands[i++].player);
      // Find low winners
      let lowWinners = [];
      if (this.scoring == 'highlow') {
        bestHands.sort((a, b) => {
          return PokerEngine.compareLowHands(b.bestLowHand, a.bestLowHand);
        });
        let winningLowHand = bestHands[0].bestLowHand;
        let i = 0;
        if (winningLowHand != null) {
          while (i < bestHands.length && PokerEngine.compareLowHands(winningLowHand, bestHands[i].bestLowHand) == 0)
            lowWinners.push(bestHands[i++].player);
        }
      }
      return {
        bestHands: bestHands, // [ best hand for each player ]
        highWinners: highWinners, // [ indexes of players who won high hand ]
        lowWinners: lowWinners,  // [ indexes of players who won low hand ]
        communityCards: allCommunityCards
      }
    }
  }

  // export default PokerEngine;
  return PokerEngine;
})();