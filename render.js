// renders a spritesheet for use with discord
const { createCanvas, Image } = require('canvas')
const emojiData = require(`./emoji_data.json`)

const skinTones = ["tone0", "tone1", "tone2", "tone3", "tone4", "tone5"]

const diversityMap = {
  "1f3fb":"tone1",
  "1f3fc":"tone2",
  "1f3fd":"tone3",
  "1f3fe":"tone4",
  "1f3ff":"tone5"
}

// CONFIG
const formats = {
  "picker": {
    "sizes": [44],
    "emoji_per_row": 11
  },
  "color": {
    "sizes": [64, 96],
    "emoji_per_row": 10,
    "skintones": true
  },
  "large": {
    "sizes": [64, 96],
    "emoji_per_row": 42
  }
}

function renderSheets(){
  for(const form of Object.keys(formats)){
    let f = formats[form]
    for(const s of f.sizes){
      if(f.skintones){
        for(const sk of skinTones){
          processSheet(form, s, f["emoji_per_row"], sk)
        }
        continue;
      }
      processSheet(form, s, f["emoji_per_row"])
    }
  }
}

const fs = require("fs")
let img = new Image()

function toCodePoint(unicodeSurrogates, sep) {
  var r = [],
    c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
      p = 0;
    } else if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

function getPickerEmoji(){
  let parsedEmoji = [];

  for(var i = 0; i < 50; i++) parsedEmoji.push(emojiData.people[i].surrogates)

  return parsedEmoji;
}

function getDiversityEmoji(emoji){
  let diversity = {};
  for(const d of emoji.diversityChildren){
    let n = d.diversity.join('-')
    if(diversityMap[n]) diversity[diversityMap[n]] = d
  }
  return diversity;
}

function getRequiredEmoji(skinTone){
  let parsedEmoji = [];

  // get the data we need
  for(const cat of Object.keys(emojiData)){
    for(const e of emojiData[cat]){
      if(!skinTone){
        if(!e.hasDiversity) parsedEmoji.push(e.surrogates)
      } else {
        if(!e.hasDiversity) continue;
        if(skinTone == "tone0") {
          parsedEmoji.push(e.surrogates)
          continue;
        }
        let diversityEmoji = getDiversityEmoji(e)
        if(!diversityEmoji[skinTone]) continue;
        parsedEmoji.push(diversityEmoji[skinTone].surrogates)
      }
    }
  }

  return parsedEmoji;
}

function processSheet(name, size, emojiPerRow, skinTone = false){
  let parsedEmoji;
  if(name !== "picker"){
    parsedEmoji = getRequiredEmoji(skinTone)
  } else {
    parsedEmoji = getPickerEmoji()
  }
  
  // Get canvas height
  let height = Math.ceil(parsedEmoji.length / emojiPerRow)

  const canvas = createCanvas(emojiPerRow*size, height*size);
  let ctx = canvas.getContext("2d");

  let diff = Date.now();
  let x = 0;
  let y = 0;
  let index = 0;

  for(var i = 0; i < height; i++){
    x = 0;
    for(var l = 0; l < emojiPerRow; l++){
      try{
        let codepoint = toCodePoint(parsedEmoji[index])
        ir = fs.readFileSync(`./72x72/${codepoint}.png`)
        img.src = ir
        ctx.drawImage(img, x, y, size, size);
      }catch(e){
        // Uncomment the lines below if you want an error texture to help with debugging missing emoji
        
        // ir = fs.readFileSync(`./missing_texture.png`)
        // img.src = ir
        // ctx.drawImage(img, x, y, size, size);
        
      }
      index++;
      x += size
    }
    y += size
  }

  if(skinTone) name = `${name}_${skinTone}`

  fs.writeFileSync(`./spritesheets/sheet_${name}-${size}.png`, canvas.toBuffer())
  console.log(`Rendered sheet_${name}-${size} in ${((Date.now() - diff)/1000).toFixed(2)}s`)
}

renderSheets()