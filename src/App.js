import './App.css';

import React, { useState } from 'react'

import axios from 'axios'

import Scatterplot from './js/Scatterplot.js';
import AutocompleteCities from './js/AutocompleteCities.js';
import AutocompleteBodies from './js/AutocompleteBodies.js'

import starFile from './stars/stars.txt'

const Astronomy = require('./js/astronomy.js');


const elevation = 351
var localObserver = null

let timezone= -2


navigator.geolocation.getCurrentPosition(function (position) {
  localObserver = new Astronomy.Observer(position.coords.latitude, position.coords.longitude, elevation);
  
  let newURL = `http://api.timezonedb.com/v2.1/get-time-zone?key=41I0S90JC6N3&format=json&by=position&lat=${position.coords.latitude}&lng=${position.coords.longitude}`
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
  let newURL = `http://api.timezonedb.com/v2.1/get-time-zone?key=41I0S90JC6N3&format=json&by=position&lat=${lat}&lng=${long}`
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

export function setUpdateDataFromSuggestion(value){
  let splitVal = value.split(",")
  updateStarData(new Body(splitVal[0], Number(splitVal[1]), Number(splitVal[2]), new Date(), 1))
}

function updateStarData(body){
  if(localObserver != null){
  document.getElementById("body").innerHTML = "Body: " + body.label;

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
  constructor(label, ra, dec, localDate, importance){
      this.label = label;
      let bodyData = Astronomy.Horizon(localDate, localObserver, ra, dec, 'normal');
      this.altitude = Number(bodyData.altitude);
      this.azimuth = Number(bodyData.azimuth);
      this.ra = Number(ra);
      this.dec = Number(dec);
      this.importance = importance ;
  }
}    

function createData(bodies, setStarData){ 
    const data = []
    for(let i =0; i <bodies.length; i++){
      let bodyData = bodies[i]
      if(bodyData.altitude >= 0){ 
        let bgColor = 'rgb(255, 255,255)'
        if(bodies[i].label === "Sun") {bgColor = 'rgb(255, 255,0)'}
        if(bodies[i].label === "Moon") {bgColor = 'rgb(125, 125, 125)'}
        
        data.push({
            label: bodies[i].label,
            data:[{x:1*(1-bodyData.altitude/90)*Math.sin(bodyData.azimuth*Astronomy.DEG2RAD), y:1*(1-bodyData.altitude/90)*Math.cos(bodyData.azimuth*Astronomy.DEG2RAD)}],
            backgroundColor: bgColor,
            pointRadius: bodyData.importance
          });
      }
      // else{
      //   console.log(`${bodies[i].label}: Below horizon`)
      // }
    }
    setStarData({datasets: data});
}

async function getBodiesFromFile(){
  const fileBodyObjects = []
  await fetch(starFile)
  .then(r => r.text())
  .then( text =>{
      const currentDate = new Date();
      let splitT = text.split("\n")
      for(let i =0; i < splitT.length; i++){
        let line = splitT[i].trim().split(",");

        
        let label = splitT[i].trim().split(",")[0];
        let raSplit = line[1].split(" ");
        let ra = ((Number(raSplit[1].slice(0,-1))/60)+Number(raSplit[0].slice(0,-1)))

        let decSplit = line[2].split(" ")
        let dec = (Number(decSplit[0] + "."+ decSplit[1].slice(0,-1)))

        fileBodyObjects.push(new Body(label, ra, dec, currentDate, 1))
      }
    })
    return fileBodyObjects;
}

async function getBodyArray(useFileData){
  if(localObserver !== null){
    const bodyObjects = []
    
    const rawBodies = [Astronomy.Body.Sun, Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Moon, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Uranus, Astronomy.Body.Saturn, Astronomy.Body.Neptune]
    const currentDate = new Date()
    for(let i = 0; i <rawBodies.length; i++){
      let tempEquator = (Astronomy.Equator(rawBodies[i], new Date(), localObserver, true, false));
      bodyObjects.push(new Body(rawBodies[i].toString(), tempEquator.ra, tempEquator.dec,currentDate, 2.5));
    }
    if(useFileData){
      let file = await getBodiesFromFile();
      for(let i = 0; i < file.length; i++){
        bodyObjects.push(file[i])
      }
    }
    return bodyObjects;  
  }
}
async function getBodySuggestions(useFileData){
  if(localObserver !== null){
    const bodyObjects = await getBodyArray(useFileData);
    const suggestions = [];
    for(let i = 0; i < bodyObjects.length; i++){
      suggestions.push(`${bodyObjects[i].label.toString()},${bodyObjects[i].ra},${bodyObjects[i].dec},`)
    }
    return suggestions;
  }
}

export async function dataUpdater(setStarData, useFileData){
  if(localObserver !== null && timezone !== -1){
    const bodyObjects = await getBodyArray(useFileData)
    updateLocalData()
    createData(bodyObjects, setStarData)  
    updateStarData(bodyObjects[0]);
  }
  else{
    setTimeout(dataUpdater, 500, setStarData, useFileData)
  }
}

function App() {
  const [starData, setStarData] = useState({datasets: [{label: 'horizon scatterplot',data: [{}],backgroundColor: 'rgb(255, 255,255)'}],});
  const [useFileData, setUseFileData] = useState(true)
  window.addEventListener("load", ()=>{
      dataUpdater(setStarData, useFileData);
  });

  return (
  <div>
    <div className='dataSeparator'>
      <p>local data/zenith coords</p>
      <hr/>
      <AutocompleteCities setData={setStarData}  useFileData= {useFileData}/>
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
        <AutocompleteBodies suggestionsPromise={getBodySuggestions(useFileData)}/>
      </div>
      
      <button className = "button" onClick={()=>{setUseFileData(!useFileData);dataUpdater(setStarData, !useFileData)}}>
        toggle extra solar objects
      </button>
      <main id = "body"></main>
      <main id = "relToHorizon"></main>
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
