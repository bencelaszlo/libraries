let fs = require('fs')

function compareJSON(obj1, obj2, path = '') {
  let diff = {};

  // Check keys in obj1
  for (let key in obj1) {
      if (obj1.hasOwnProperty(key)) {
          const fullPath = (path ? path + '.' : '') + key;
          if (!obj2.hasOwnProperty(key)) {
              diff[fullPath] = { oldValue: obj1[key], newValue: undefined };
          } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
              const nestedDiff = compareJSON(obj1[key], obj2[key], fullPath);
              if (Object.keys(nestedDiff).length > 0) {
                  diff[fullPath] = nestedDiff;
              }
          } else if (obj1[key] !== obj2[key]) {
              diff[fullPath] = { oldValue: obj1[key], newValue: obj2[key] };
          }
      }
  }

  // Check keys in obj2 to find any additional keys
  for (let key in obj2) {
      if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
          const fullPath = (path ? path + '.' : '') + key;
          diff[fullPath] = { oldValue: undefined, newValue: obj2[key] };
      }
  }

  return diff;
}

fs.readFile( __dirname + '/../libraries.json', function (err, data) {
  if (err) {
    throw err; 
  }
  data = JSON.parse(data.toString());

  if (typeof data !== 'object') {
    throw new Error('Expected JSON object');
  }

  let previousLanguage = ""
  let error = []

  // javaScript and TypeScript must be the same
  if (JSON.stringify(data["JavaScript"]) !==  JSON.stringify(data["TypeScript"])) {
    const diff = compareJSON(data["JavaScript"], data["TypeScript"]);
    error.push('ERROR: JavaScript and TypeScript must have the same libraries and same values. Diff: ' + JSON.stringify(diff));

    for (let i of Object.keys(data["JavaScript"])) {
      if (!data["TypeScript"][i]) {
        error.push('Key JavaScript.' + i + ' not found in TypeScript');
      }
    }
  }

  Object.keys(data).forEach(function(language) {
    // Check alphabetical order of languages
    if (language.toLowerCase() < previousLanguage.toLowerCase()) {
      error.push('ERROR: Languages are not in alphabetical order. ' + previousLanguage + ' is before ' + language)
    }

    previousLanguage = language

    let previousLibrary = ""
    for (library in data[language]){
      // Check alphabetical order of libraries
      if (library.toLowerCase() < previousLibrary.toLowerCase()) {
        error.push('ERROR: Libraries are not in alphabetical order. ' + previousLibrary + ' is before ' + library + ' for ' + language)
      }
      previousLibrary = library

      // Check expected structure
      if (!Array.isArray(data[language][library].imports) || data[language][library].imports.length === 0) {
        error.push('ERROR: ' + language + '.'  + library + '.imports must exist, must be an array and must have at least one element.')
      }
      if (!Array.isArray(data[language][library].technologies)  || data[language][library].technologies.length === 0) {
        error.push('ERROR: ' + language + '.'  + library + '.technologies must exist, must be an array and must have at least one element')
      }
      if (typeof data[language][library].description === 'undefined' || data[language][library].description === '') {
        error.push('ERROR: ' + language + '.' + library + '.description must exist and cannot be empty')
      }
      if (data[language][library].description) {
        if (typeof data[language][library].description !== 'string') {
          error.push('ERROR: ' + language + '.' + library + '.description must be of type string');
        }
      }
      if (data[language][library].image) {
        if (typeof data[language][library].image !== 'string') {
          error.push('ERROR: ' + language + '.' + library + '.image must be of type string');
        }
      }
    }
  })

  if (error.length > 0) {
    for (let i of error) {
      console.log(i);
    }
  }

});