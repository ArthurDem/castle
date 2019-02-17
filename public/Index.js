//Required libraries
const scrape = require('./Castle.js');
const michelinScrape = require('./Michelin.js');
let fs = require('fs');

'use strict';

const hotelJSON = scrape.getHotelsJSON();
const JSONMichelin = michelinScrape.getRestaurantsJSON();

fs.writeFileSync("RelaisEtoiles.json", JSON.stringify(findMutualChefsAndPCs(hotelJSON, JSONMichelin)));

function findMutualChefsAndPCs(listHotels, listMichelin) {
  let HotelsEtoiles = [];
  for (let i = 0; i < listHotels.length; i++) {
    for (let j = 0; j < listMichelin.length; j++) {
      if (listHotels[i].chef === listMichelin[j].chef && listHotels[i].postalCode === listMichelin[j].postalCode) {
        HotelsEtoiles.push({
          "hotelName": listHotels[i].name,
          "restaurantName": listMichelin[j].name,
          "postalCode": listHotels[i].postalCode,
          "chef": listHotels[i].chef,
          "url": listHotels[i].url,
          "price": listHotels[i].price
        })
      }
    }
  }
  return HotelsEtoiles;
}

console.log("Fichier écrit.");