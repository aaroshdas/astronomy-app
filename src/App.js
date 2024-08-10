import './App.css';

import React, { useState } from 'react'

import axios from 'axios'

import Scatterplot from './js/Scatterplot.js';
import Autocomplete from './js/Autocomplete.js';

const Astronomy = require('./js/astronomy.js');

let timezone= -1
const elevation = 351
var localObserver = null

navigator.geolocation.getCurrentPosition(function (position) {
 localObserver = new Astronomy.Observer(position.coords.latitude, position.coords.longitude, elevation);
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

  
  let newURL = `http://api.timezonedb.com/v2.1/get-time-zone?key=41I0S90JC6N3&format=json&by=position&lat=${lat}&lng=${long}`
  axios.get(newURL)
  .catch(function(){
    console.log("axios error")
  })
  .then((response => {
    timezone = (response.data["gmtOffset"])
  }));
  updateLocalData()
  updateStarData(Astronomy.Body.Moon);
}

function GetLocalDate(){
  if(timezone !== -1){
  const date = new Date()
  const localTime = date.getTime()
  const localOffset = date.getTimezoneOffset() * 60000
  const utc = localTime + localOffset
  var time = utc + (1000 * timezone)

  const newDate = new Date(time);
  return(newDate);
  }
  return new Date();
}
function updateStarData(bodyObject){
  if(localObserver != null){
  const localDate = GetLocalDate()
  var body = (Astronomy.Equator(bodyObject, localDate, localObserver, true, false))
  document.getElementById("body").innerHTML = "Body: " + bodyObject;

  document.getElementById("bodyRA").innerHTML = "Right ascension: "+ createHourString(body.ra);
  document.getElementById("bodyDec").innerHTML = "Declination: " + body.dec.toFixed(5);

  var bodyData = Astronomy.Horizon(localDate, localObserver, body.ra, body.dec, 'normal');
  document.getElementById("azimuth").innerHTML = "Azimuth: "+ bodyData.azimuth.toFixed(5);
  document.getElementById("altitude").innerHTML = "Altitude: " + bodyData.altitude.toFixed(5);

  if(bodyData.altitude >= 0){document.getElementById("relToHorizon").innerHTML = "Horizon: Above horizon"}
  else{document.getElementById("relToHorizon").innerHTML = "Horizon: Below horizon"}
  }
}

function updateLocalData(){
  if(localObserver != null){
    const declination= localObserver.latitude;
    const localDate = GetLocalDate()
    const rawRA = Astronomy.SiderealTime(localDate)+localObserver.longitude/15.0+240.0;
    const rightAscension = rawRA - Math.floor(rawRA/24.0)*24.0;  
  
    document.getElementById("longlat").innerHTML = ("Latitude/longtitude: " + localObserver.latitude.toFixed(4).toString() + ", "+ localObserver.longitude.toFixed(4).toString())
    document.getElementById("localDate").innerHTML = ("Local time: " + localDate.toString().slice(16,25))
    document.getElementById("utcDate").innerHTML = ("UTC time: " + new Date().toUTCString().slice(16,25))
    document.getElementById("RA").innerHTML = ("Local right ascension: " + createHourString(rightAscension.toFixed(5)))
    document.getElementById("dec").innerHTML = ("Local declination: " + declination.toFixed(5)) 
  }  
}

class Body{
  constructor(label, ra, dec){
      this.label = label;
      let bodyData = Astronomy.Horizon(GetLocalDate(), localObserver, ra, dec, 'normal');
      this.altitude = bodyData.altitude;
      this.azimuth = bodyData.azimuth;
  }
}    
function createData(bodies, setStarData){ 
    const data = []
    for(let i =0; i <bodies.length; i++){
      let bodyData = bodies[i]
      if(bodyData.altitude >= 0){ 
        data.push({
            label: bodies[i].label,
            data:[{x:1*(1-bodyData.altitude/90)*Math.sin(bodyData.azimuth*Astronomy.DEG2RAD), y:1*(1-bodyData.altitude/90)*Math.cos(bodyData.azimuth*Astronomy.DEG2RAD)}],
            backgroundColor: 'rgb(255, 255,255)'
          });
      }
      else{
        console.log(`${bodies[i].label}: Below horizon`)
      }
    }
    setStarData({datasets: data});
}

export function dataUpdater(setStarData){
  if(localObserver !== null){
    const rawBodies = [Astronomy.Body.Sun, Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Moon, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Uranus, Astronomy.Body.Saturn, Astronomy.Body.Neptune]
    const bodyObjects = []
    for(let i = 0; i <rawBodies.length; i++){
      const localDate = GetLocalDate()
      let tempEquator = (Astronomy.Equator(rawBodies[i], localDate, localObserver, true, false))
      bodyObjects.push(new Body(rawBodies[i].toString(), tempEquator.ra, tempEquator.dec))
    }    
    createData(bodyObjects, setStarData)  
    updateStarData(Astronomy.Body.Moon);
    updateLocalData()
  }
  else{
    setTimeout(dataUpdater, 500, setStarData)
  }
}

function App() {
  const [starData, setStarData] = useState({datasets: [{label: 'horizon scatterplot',data: [{}],backgroundColor: 'rgb(255, 255,255)'}],});
  
  window.addEventListener("load", ()=>{
    dataUpdater(setStarData);
  });

  return (
  <div>
    <div className='dataSeparator'>
      <p>local data/zenith coords</p>
      <hr/>
      <Autocomplete setData={setStarData}></Autocomplete>
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
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Sun);}}>sun</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Mercury);}}>mercury</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Venus);}}>venus</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Moon);}}>moon</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Mars);}}>mars</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Jupiter);}}>jupiter</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Uranus);}}>uranus</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Saturn);}}>saturn</button>
        <button className = "button" onClick={()=>{updateStarData(Astronomy.Body.Neptune);}}>neptune</button>
      </div>
    <hr/>
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
