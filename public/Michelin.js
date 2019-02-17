//Required libraries for scraping
let Promise = require('promise');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');

//List of promises to create
let listPromises = [];
let listPromisesIndiv = [];

let listRestaurants = [];
let scrapingCount = 1;

//Creating promises
function newPromise() {
  for (let i = 1; i <= 37; i++) {
    let url = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-' + i.toString();
    listPromises.push(fillRestaurantsList(url));
    console.log("Page " + i + " of starred Michelin restaurants added to the list");
  }
}

function newIndividualPromise() {
  return new Promise(function(resolve) {
    if (scrapingCount === 1) {
      for (let i = 0; i < listRestaurants.length / 2; i++) {
        let restaurantURL = listRestaurants[i].url;
        listPromisesIndiv.push(fillRestaurantInfo(restaurantURL, i));
        console.log("Added url of " + i + "th restaurant to the promises list");
      }
      resolve();
      scrapingCount++;
    }
    if (scrapingCount === 2) {
      for (let i = listRestaurants.length / 2; i < listRestaurants.length; i++) {
        let restaurantURL = listRestaurants[i].url;
        listPromisesIndiv.push(fillRestaurantInfo(restaurantURL, i));
        console.log("Added url of " + i + "th restaurant to the promises list");
      }
      resolve();
    }
  })
}

//Fetching list of all restaurants
function fillRestaurantsList(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(err, res, html) {
      if (err) {
        console.error(err);
        return reject(err);
      } else if (res.statusCode !== 200) {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        console.error(err);
        return reject(err);
      }
      let $ = cheerio.load(html);
      $('.poi-card-link').each(function() {
        let data = $(this);
        let link = data.attr("href");
        let url = "https://restaurant.michelin.fr/" + link;
        listRestaurants.push({
          "name": "",
          "postalCode": "",
          "chef": "",
          "url": url
        })
      });
      resolve(listRestaurants);
    });
  });
}

//Getting all detailed info for the JSON file
function fillRestaurantInfo(url, index) {
  return new Promise(function(resolve, reject) {
    request(url, function(err, res, html) {
      if (err) {
        console.error(err);
        return reject(err);
      } else if (res.statusCode !== 200) {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        console.error(err);
        return reject(err);
      }

      const $ = cheerio.load(html);
      $('.poi_intro-display-title').first().each(function() {
        let data = $(this);
        let name = data.text();
        name = name.replace(/\n/g, "");
        listRestaurants[index].name = name.trim();
      });

      $('.postal-code').first().each(function() {
        let data = $(this);
        let pc = data.text();
        listRestaurants[index].postalCode = pc;
      });

      $('#node_poi-menu-wrapper > div.node_poi-chef > div.node_poi_description > div.field.field--name-field-chef.field--type-text.field--label-above > div.field__items > div').first().each(function() {
        let data = $(this);
        let chefname = data.text();
        listRestaurants[index].chef = chefname;
      });
      console.log("Added info of " + index + "th restaurant");
      resolve(listRestaurants);
    });
  });
}

//Saving the file as RestaurantsEtoiles.json
function saveRestaurantsInJson() {
  return new Promise(function(resolve) {
    try {
      console.log("Trying to write the restaurant's JSON file");
      let jsonRestaurants = JSON.stringify(listRestaurants);
      fs.writeFile("RestaurantsEtoiles.json", jsonRestaurants, function doneWriting(err) {
        if (err) {
          console.error(err);
        }
      });
    } catch (error) {
      console.error(error);
    }
    resolve();
  });
}

//Main()
newPromise();
Promise.all(listPromises)
  .then(newIndividualPromise)
  .then(() => {
    return Promise.all(listPromisesIndiv);
  })
  .then(newIndividualPromise)
  .then(() => {
    return Promise.all(listPromisesIndiv);
  })
  .then(saveRestaurantsInJson)
  .then(() => {
    console.log("Successfully saved restaurants JSON file")
  });

module.exports.getRestaurantsJSON = function() {
  return JSON.parse(fs.readFileSync("RestaurantsEtoiles.json"));
};