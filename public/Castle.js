//Required libraries for scraping
let Promise = require('promise');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');

//List of promises to create
let listPromisesIndiv = [];
let listPromises = [];
let listHotels = [];
let scrapingCount = 1;

//Fetching list of hotels
function fillListHotels(url) {
  return new Promise(function (result, reject) {
    request(url, function (err, res, html) {
      if (err) {
        console.log(err);
        return reject(err);
      } else if (res.statusCode !== 200) {
        err = new Error("Unexpected status code : " + res.statusCode);
        err.res = res;
        return reject(err);
      }
      let $ = cheerio.load(html);

      let hotelsFrance = $('h3:contains("France")').next();
      hotelsFrance.find('li').length;
      hotelsFrance.find('li').each(function () {
        let data = $(this);
        let url = String(data.find('a').attr("href"));
        let name = data.find('a').first().text();
        name = name.replace(/\n/g, "");
        let chefName = String(data.find('a:contains("Chef")').text().split(' - ')[1]);
        chefName = chefName.replace(/\n/g, "");
        listHotels.push({
          "name": name.trim(),
          "postalCode": "",
          "chef": chefName.trim(),
          "url": url,
          "price": ""
        })
      });
      result(listHotels);
    });
  });
}

function fillHotelInfo(url, index) {
    return new Promise(function (result, reject) {
      request(url, function (err, res, html) {
        if (err) {
          console.error(err);
          return reject(err);
        } else if (res.statusCode !== 200) {
          err = new Error("Unexpected status code : " + res.statusCode);
          err.res = res;
          return reject(err);
        }
  
        const $ = cheerio.load(html);
  
        $('span[itemprop="postalCode"]').first().each(function () {
          let data = $(this);
          let pc = data.text();
          listHotels[index].postalCode = String(pc.split(',')[0]).trim();
        });
  
        $('.price').first().each(function () {
          let data = $(this);
          let price = data.text();
          listHotels[index].price = String(price);
        });
        console.log("Added postal code and price of " + index + "th hotel");
        result(listHotels);
      });
    });
  }

function newPromise() {
  let url = 'https://www.relaischateaux.com/fr/site-map/etablissements';
  listPromises.push(fillListHotels(url));
  console.log("Relais et Chateaux hotels added to the list");
}

function newIndividualPromise() {
  return new Promise(function (result) {
    if (scrapingCount === 1) {
      for (let i = 0; i < Math.trunc(listHotels.length / 2); i++) {
        let hotelURL = listHotels[i].url;
        listPromisesIndiv.push(fillHotelInfo(hotelURL, i));
        console.log("Added url of the " + i + " hotel to the promises list");
      }
      result();
      scrapingCount++;
    } else if (scrapingCount === 2) {
      for (let i = listHotels.length / 2; i < Math.trunc(listHotels.length); i++) {
        let hotelURL = listHotels[i].url;
        listPromisesIndiv.push(fillHotelInfo(hotelURL, i));
        console.log("Added url of the " + i + "the hotel to the promises list");
      }
      result();
    }
  })
}

function saveHotelsInJson() {
  return new Promise(function (result) {
    try {
      console.log("Editing JSON file");
      let jsonHotels = JSON.stringify(listHotels);
      fs.writeFile("ListeRelais.json", jsonHotels, function doneWriting(err) {
        if (err) {
          console.log(err);
        }
      });
    } catch (error) {
      console.error(error);
    }
    result();
  });
}


//Main()
newPromise();
let prom = listPromises[0];
prom
  .then(newIndividualPromise)
  .then(() => {
    return Promise.all(listPromisesIndiv);
  })
  .then(newIndividualPromise)
  .then(() => {
    return Promise.all(listPromisesIndiv);
  })
  .then(saveHotelsInJson)
  .then(() => {
    console.log("JSON file OK")
  });

module.exports.getHotelsJSON = function () {
  return JSON.parse(fs.readFileSync("ListeRelais.json"));
};