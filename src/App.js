import './App.css';

import React from 'react'

import axios from 'axios'

import { createRipple } from './Ripple.js';

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
function updateData(bodyObject, bodyString){
  navigator.geolocation.getCurrentPosition(function (position) {
    const Astronomy = require('./astronomy.js');

    const declination= position.coords.latitude;
  
    const localDate = new Date();    
    const rawRA = Astronomy.SiderealTime(localDate)+position.coords.longitude/15.0+240.0;
    const rightAscension = rawRA - Math.floor(rawRA/24.0)*24.0;  
  
    document.getElementById("longlat").innerHTML = ("Latitude/longtitude: " + position.coords.latitude.toFixed(4).toString() + ", "+ position.coords.longitude.toFixed(4).toString())
    document.getElementById("localDate").innerHTML = ("Local time: " + localDate.toString().slice(16,25))
    document.getElementById("utcDate").innerHTML = ("UTC time: " + localDate.toUTCString().slice(16,25))
    document.getElementById("RA").innerHTML = ("Local right ascension: " + createHourString(rightAscension.toFixed(5)))
    document.getElementById("dec").innerHTML = ("Local declination: " + declination.toFixed(5))


    let url = `https://api.open-elevation.com/api/v1/lookup?locations=${position.coords.latitude},${position.coords.longitude}`
    axios.get(url)
    .catch(function(error){
      console.log(error)
    })
    .then((response => {
      var localObserver = new Astronomy.Observer(position.coords.latitude, position.coords.longitude, response.data['results'][0]['elevation'])

      var body = (Astronomy.Equator(bodyObject, localDate, localObserver, true, false))
      document.getElementById("body").innerHTML = bodyString;

      document.getElementById("bodyRA").innerHTML = "Right ascension: "+ createHourString(body.ra);
      document.getElementById("bodyDec").innerHTML = "Declination: " + body.dec.toFixed(5);

      var horData = Astronomy.Horizon(localDate, localObserver, body.ra, body.dec, 'normal');
      document.getElementById("azimuth").innerHTML = "Azimuth: "+ horData.azimuth.toFixed(5);
      document.getElementById("altitude").innerHTML = "Altitude: " + horData.altitude.toFixed(5);

      if(horData.altitude >= 0){document.getElementById("relToHorizon").innerHTML = "Horizon: Above horizon"}
      else{document.getElementById("relToHorizon").innerHTML = "Horizon: Below horizon"}
    }));
  });
}

function App() {
  const Astronomy = require('./astronomy.js');
  updateData(Astronomy.Body.Moon, "Body: Moon");
  window.addEventListener("load", ()=>{
    const buttons = document.getElementsByClassName("rippleButton");
    for (const button of buttons) {
      button.addEventListener("click", createRipple);
    }
  });
  return (
  <div>
    <h3>local data/zenith coords</h3>
    <div className='dataSeparator'>
      <main id = "longlat"></main>
      <main id = "localDate"></main>
      <main id = "utcDate"></main>
      <main id = "RA"></main>
      <main id = "dec"></main>
    </div>

    <div className='dataSeparator'>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Sun, "Body: Sun");}}>sun</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Mercury, "Body: Mercury");}}>mercury</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Venus, "Body: Venus");}}>venus</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Mars, "Body: Mars");}}>mars</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Jupiter, "Body: Jupiter");}}>jupiter</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Uranus, "Body: Uranus");}}>uranus</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Saturn, "Body: Saturn");}}>saturn</button>
      <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Neptune, "Body: Neptune");}}>neptune</button>
    </div>

    <h3>body coords in relation to observer</h3>
    <div className='dataSeparator'>
      <main id = "body"></main>
      <main id = "relToHorizon"></main>
      <main id = "bodyRA"></main>
      <main id = "bodyDec"></main>
      <main id = "azimuth"></main>
      <main id = "altitude"></main>
    </div>
  </div>
  );
}

export default App;
