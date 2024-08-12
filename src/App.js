import './App.css';

import React, { useState } from 'react'

import axios from 'axios'

import Scatterplot from './js/Scatterplot.js';
import AutocompleteCities from './js/AutocompleteCities.js';
import AutocompleteBodies from './js/AutocompleteBodies.js'

import starFile from './stars/bsc5.json'

const Astronomy = require('./js/astronomy.js');


const elevation = 351
var localObserver = null

let timezone= -2

let selectedBody = null;

navigator.geolocation.getCurrentPosition(function (position) {
  localObserver = new Astronomy.Observer(position.coords.latitude, position.coords.longitude, elevation);
  
  let newURL = `https://api.timezonedb.com/v2.1/get-time-zone?key=41I0S90JC6N3&format=json&by=position&lat=${position.coords.latitude}&lng=${position.coords.longitude}`
  axios.get(newURL)
  .catch(function(){
    console.log("axios error")
  })
  .then((response => {
    timezone = (response.data["gmtOffset"])
  }));
});

function createHourString(date){
  let seconds = ((date%1*100%1*1000)*600/10000).toFixed(0);
  let secStr = ":"+ seconds.toString();
  if(seconds <10){
    secStr = ":0"+seconds.toString();}

  let min = (date%1*100*60/100).toFixed(0)
  let minStr = ":"+ min.toString();
  if(min <10){
    minStr = ":0"+min.toString();}

  let temp = parseInt(date).toString() +minStr + secStr;
  return temp;
}

export function setLocation(lat, long){
  localObserver = null
  localObserver = new Astronomy.Observer(lat, long, elevation);
  timezone = -1
  let newURL = `https://api.timezonedb.com/v2.1/get-time-zone?key=41I0S90JC6N3&format=json&by=position&lat=${lat}&lng=${long}`
  axios.get(newURL)
  .catch(function(){
    console.log("axios error")
  })
  .then((response => {
    timezone = (response.data["gmtOffset"]);
  }));
}

function getLocalTime(){
  if(timezone >=0){
    const date = new Date();
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    var time = utc + (1000 * timezone);
    const newDate = new Date(time);
    return newDate;
  }
  else{
    return new Date();
  }
}

export async function setUpdateDataFromSuggestion(value, setStarData,displaySettings){
  let splitVal = value.split(",")
  const newBody = new Body(splitVal[0], Number(splitVal[1]), Number(splitVal[2]), Number(splitVal[3]), 1)
  updateStarData(newBody)
  if(newBody.altitude >0){
  }
  else{
    selectedBody = null;
  }
  const bodyObjects = await getBodyArray(displaySettings)
  createData(bodyObjects, setStarData)
}

function updateStarData(body){
  if(localObserver != null){
    selectedBody = body;
  document.getElementById("body").innerHTML = "Body: " + body.label;
  document.getElementById("mag").innerHTML = "Visual Magnitude: " + body.mag.toFixed(5);

  document.getElementById("bodyRA").innerHTML = "Right ascension: "+ createHourString(body.ra);
  document.getElementById("bodyDec").innerHTML = "Declination: " + body.dec.toFixed(5);

  document.getElementById("azimuth").innerHTML = "Azimuth: "+ body.azimuth.toFixed(5);
  document.getElementById("altitude").innerHTML = "Altitude: " + body.altitude.toFixed(5);

  if(body.altitude >= 0){document.getElementById("relToHorizon").innerHTML = "Horizon: Above horizon"}
  else{document.getElementById("relToHorizon").innerHTML = "Horizon: Below horizon"}
  }
}

function updateLocalData(){
  if(localObserver != null){
    const declination= localObserver.latitude;
    const localDate = getLocalTime()
 
    const rawRA = Astronomy.SiderealTime(new Date())+localObserver.longitude/15.0+240.0;
    const rightAscension = rawRA - Math.floor(rawRA/24.0)*24.0;  
  
    document.getElementById("longlat").innerHTML = ("Latitude/longtitude: " + localObserver.latitude.toFixed(4).toString() + ", "+ localObserver.longitude.toFixed(4).toString())
    document.getElementById("localDate").innerHTML = ("Local time: " + localDate.toString().slice(16,25))
    document.getElementById("utcDate").innerHTML = ("UTC time: " + new Date().toUTCString().slice(16,25))
    document.getElementById("RA").innerHTML = ("Local right ascension: " + createHourString(rightAscension.toFixed(5)))
    document.getElementById("dec").innerHTML = ("Local declination: " + declination.toFixed(5)) 
  }  
}

class Body{
  constructor(label, ra, dec, mag, importance){
      this.label = label;
      let bodyData = Astronomy.Horizon(new Date(), localObserver, ra, dec, 'normal');
      this.altitude = Number(bodyData.altitude);
      this.azimuth = Number(bodyData.azimuth);
      this.ra = Number(ra);
      this.dec = Number(dec);
      this.importance = importance;
      this.mag = mag;
  }
}    

function createData(bodies, setStarData){ 
    const data = []
    for(let i =0; i <bodies.length; i++){
      let bodyData = bodies[i]
      if(bodyData.altitude >= 0){ 
        let bgColor = 'rgb(255, 255,255)'
        let importanceOffset = 0
        
        if(bodies[i].importance<=1){
          importanceOffset += (bodyData.mag - 5 )*-0.25
          bgColor = `rgb(255, 255, ${255-(bodyData.mag - 6 )*-10 })`
        }
        else{
          importanceOffset += (bodyData.mag - 5 )*-0.075
          bgColor = `rgb(255, 255, ${255-(bodyData.mag - 6 )*-5 })`
        }
        if(bodies[i].label === "Sun") {bgColor = 'rgb(255, 255,0)';importanceOffset+=0.35}


        if(selectedBody !== null){
          if(bodies[i].label=== selectedBody.label){bgColor = 'rgb(232, 65, 65)'; importanceOffset +=1}
        }


        data.push({
            label: bodies[i].label,
            data:[{x:1*(1-bodyData.altitude/90)*Math.sin(bodyData.azimuth*Astronomy.DEG2RAD), y:1*(1-bodyData.altitude/90)*Math.cos(bodyData.azimuth*Astronomy.DEG2RAD)}],
            backgroundColor: bgColor,
            pointRadius: bodyData.importance+ importanceOffset
          });
      }
      }
    setStarData({datasets: data});
}
const fileBodyObjects = []
const allFileBodyObjects = []
async function getBodiesFromFile(displaySettings){
  if(fileBodyObjects.length === 0){
    console.log("reading bsc5 file")
    for(let i = 0; i < starFile.length; i++){
      let rawDec = starFile[i]["Dec"];   
      let dec = Number(rawDec.slice(1,3))+ ((Number(rawDec.slice(9, -1))*0.01)+Number(rawDec.slice(5, 7)))/60
      if(rawDec.slice(0,1) === "-"){
        dec = dec*-1
      }

      let rawRA = starFile[i]["RA"]
      let ra = (Number(rawRA.slice(0,2)) + (Number(rawRA.slice(4,6))+(Number(rawRA.slice(8,12))*0.01))/60)
      let name = "no name"
      let mag = Number(starFile[i]["Vmag"])
      let newBody = new Body(name, ra, dec, mag,1)

      if(starFile[i].hasOwnProperty("Name")){name = starFile[i]["Name"]}
      else if(displaySettings[1] === true){
        allFileBodyObjects.push(newBody)
        continue;
      }
      newBody = new Body(name, ra, dec, mag,1)
      allFileBodyObjects.push(newBody)
      fileBodyObjects.push(newBody)
    }
  }
  else{
    const newDateFile= []
    for(let i = 0; i < allFileBodyObjects.length; i++){
      if(Number(displaySettings[2]) > allFileBodyObjects[i].mag){
        if(displaySettings[1] === true && allFileBodyObjects[i].label !== "no name"){
          newDateFile.push(new Body(allFileBodyObjects[i].label, allFileBodyObjects[i].ra, allFileBodyObjects[i].dec, allFileBodyObjects[i].mag, allFileBodyObjects[i].importance))
        }
        else if(displaySettings[1] === false){
          newDateFile.push(new Body(allFileBodyObjects[i].label, allFileBodyObjects[i].ra, allFileBodyObjects[i].dec, allFileBodyObjects[i].mag, allFileBodyObjects[i].importance))
        }
      }
    }
    return newDateFile;
  }
  return fileBodyObjects;
}

async function getBodyArray(displaySettings){
  if(localObserver !== null){
    const bodyObjects = []
    
    const rawBodies = [Astronomy.Body.Sun, Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Moon, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Uranus, Astronomy.Body.Saturn, Astronomy.Body.Neptune]
    for(let i = 0; i <rawBodies.length; i++){
      let mag = Astronomy.Illumination(rawBodies[3], new Date())["mag"]
      let tempEquator = (Astronomy.Equator(rawBodies[i], new Date(), localObserver, true, false));
      bodyObjects.push(new Body(rawBodies[i].toString(), tempEquator.ra, tempEquator.dec, mag,2.5));
    }
    if(displaySettings[0] === true){
      let file = await getBodiesFromFile(displaySettings);
      for(let i = 0; i < file.length; i++){
        bodyObjects.push(file[i])
      }
    }
    return bodyObjects;  
  }
}
async function getBodySuggestions(displaySettings){
  if(localObserver !== null){
    const bodyObjects = await getBodyArray(displaySettings);
    const suggestions = [];
    for(let i = 0; i < bodyObjects.length; i++){
      suggestions.push(`${bodyObjects[i].label.toString()},${bodyObjects[i].ra},${bodyObjects[i].dec},${bodyObjects[i].mag}`)
    }
    return suggestions;
  }
}

export async function dataUpdater(setStarData,displaySettings){
  if(localObserver !== null && timezone !== -1){
    const bodyObjects = await getBodyArray(displaySettings)
    updateLocalData()
    updateStarData(bodyObjects[0]);
    createData(bodyObjects, setStarData)  
  }
  else{
    setTimeout(dataUpdater, 500, setStarData,displaySettings)
  }
}

function App() {
  const [starData, setStarData] = useState({datasets: [{label: 'horizon scatterplot',data: [{}],backgroundColor: 'rgb(255, 255,255)'}],});
  // ARRAY [use extra stars, only named stars]
  const [displaySettings, setDisplaySettings] = useState([true, true, 8])
  window.addEventListener("load", ()=>{
      dataUpdater(setStarData, displaySettings);
  });

  return (
  <div>
    <div className='dataSeparator'>
      <p>local data/zenith coords</p>
      <hr/>
      <AutocompleteCities setStarData={setStarData} displaySettings= {displaySettings}/>
      <main id = "longlat"></main>
      
      <main id = "localDate"></main>
      <main id = "utcDate"></main>
      <main id = "RA"></main>
      <main id = "dec"></main>
      <hr/>
    </div>
    <div className='scatterplot'>
    <Scatterplot chartData={starData}></Scatterplot>
    </div>
   
    <div className='starInfo'>
      <p>body coords in relation to observer</p>
      <div className='buttonContainer'>
        <AutocompleteBodies suggestionsPromise={getBodySuggestions(displaySettings)} displaySettings={displaySettings} setStarData={setStarData}/>
      </div>
    
      <div className = 'checkbox'>
        <input type="checkbox" id="extra-solar" onClick={()=>{setDisplaySettings([!displaySettings[0], displaySettings[1], displaySettings[2]]);dataUpdater(setStarData, [!displaySettings[0], displaySettings[1], displaySettings[2]])}} defaultChecked/>
        <label htmlFor ="extra-solar">show extra solar objects</label>
      </div>
      <div className = 'checkbox'>
        <input type="checkbox" id="show-unnamed" onClick={()=>{setDisplaySettings([displaySettings[0], !displaySettings[1], displaySettings[2]]);dataUpdater(setStarData, [displaySettings[0], !displaySettings[1], displaySettings[2]])}}/>
        <label htmlFor ="show-unnamed">show unnamed objects</label>
      </div>
      <div className='vMagSetter'>
        <main>set max extra solar vmag:</main>
        <input id = "minMag" defaultValue={displaySettings[2]} type = "number" max = "12" placeholder='max visual magnitude...'/>
        <button className='button' onClick={()=>{setDisplaySettings([displaySettings[0],displaySettings[1], document.getElementById("minMag").value]);dataUpdater(setStarData, [displaySettings[0], displaySettings[1], document.getElementById("minMag").value]) }}>submit</button>
      </div>
      <main id = "body"></main>
      <main id = "relToHorizon"></main>
      <main id = "mag"></main>
      <main id = "bodyRA"></main>
      <main id = "bodyDec"></main>
      <main id = "azimuth"></main>
      <main id = "altitude"></main>
    <hr/>
    </div>
  </div>
  );
}

export default App;
