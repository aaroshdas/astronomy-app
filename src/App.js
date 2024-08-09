import './App.css';

import React, { useState } from 'react'

import axios from 'axios'

import { createRipple } from './Ripple.js';

import Scatterplot from './Scatterplot.js';

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
const Astronomy = require('./astronomy.js');

var localObserver = null
navigator.geolocation.getCurrentPosition(function (position) {
 
  let url = `https://api.open-elevation.com/api/v1/lookup?locations=${position.coords.latitude},${position.coords.longitude}`
  axios.get(url)
  .catch(function(){
    console.log("axios error")
  })
  .then((response => {
    localObserver = new Astronomy.Observer(position.coords.latitude, position.coords.longitude, response.data['results'][0]['elevation']);
  }));
});

function updateData(bodyObject){
  navigator.geolocation.getCurrentPosition(function (position) {
    const declination= position.coords.latitude;
  
    const localDate = new Date();    
    const rawRA = Astronomy.SiderealTime(localDate)+position.coords.longitude/15.0+240.0;
    const rightAscension = rawRA - Math.floor(rawRA/24.0)*24.0;  
  
    document.getElementById("longlat").innerHTML = ("Latitude/longtitude: " + position.coords.latitude.toFixed(4).toString() + ", "+ position.coords.longitude.toFixed(4).toString())
    document.getElementById("localDate").innerHTML = ("Local time: " + localDate.toString().slice(16,25))
    document.getElementById("utcDate").innerHTML = ("UTC time: " + localDate.toUTCString().slice(16,25))
    document.getElementById("RA").innerHTML = ("Local right ascension: " + createHourString(rightAscension.toFixed(5)))
    document.getElementById("dec").innerHTML = ("Local declination: " + declination.toFixed(5))


        var body = (Astronomy.Equator(bodyObject, localDate, localObserver, true, false))
        document.getElementById("body").innerHTML = "Body: " + bodyObject;

        document.getElementById("bodyRA").innerHTML = "Right ascension: "+ createHourString(body.ra);
        document.getElementById("bodyDec").innerHTML = "Declination: " + body.dec.toFixed(5);

        var bodyData = Astronomy.Horizon(localDate, localObserver, body.ra, body.dec, 'normal');
        document.getElementById("azimuth").innerHTML = "Azimuth: "+ bodyData.azimuth.toFixed(5);
        document.getElementById("altitude").innerHTML = "Altitude: " + bodyData.altitude.toFixed(5);

        if(bodyData.altitude >= 0){document.getElementById("relToHorizon").innerHTML = "Horizon: Above horizon"}
        else{document.getElementById("relToHorizon").innerHTML = "Horizon: Below horizon"}   
    });
}

class Body{
  constructor(label, ra, dec, localDate){
      this.label = label;
      let bodyData = Astronomy.Horizon(localDate, localObserver, ra, dec, 'normal');
      this.altitude = bodyData.altitude;
      this.azimuth = bodyData.azimuth;
  }
}    
function createData(bodies, setStarData){ 
    const data = []
    for(let i =0; i <bodies.length; i++){
      let bodyData = bodies[i]
      if(bodyData.altitude >= 0){console.log(`${bodies[i].label}: Above horizon`); 
        data.push({
            label: bodies[i].label,
            //data:[{x:bodyData.azimuth, y:bodyData.altitude}],
            data:[{x:1*(1-bodyData.altitude/90)*Math.cos(bodyData.azimuth*Astronomy.DEG2RAD), y:1*(1-bodyData.altitude/90)*Math.sin(bodyData.azimuth*Astronomy.DEG2RAD)}],
            backgroundColor: 'rgb(255, 255,255)'
          });
      }
      else{
        console.log(`${bodies[i].label}: Below horizon`)
      }
    }
    setStarData({datasets: data});
}

function dataUpdater(setStarData){
  if(localObserver !== null){
    const rawBodies = [Astronomy.Body.Sun, Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Moon, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Uranus, Astronomy.Body.Saturn, Astronomy.Body.Neptune]
    const bodyObjects = []
    for(let i = 0; i <rawBodies.length; i++){
      const localDate = new Date(); 
      let tempEquator = (Astronomy.Equator(rawBodies[i], localDate, localObserver, true, false))
      bodyObjects.push(new Body(rawBodies[i].toString(), tempEquator.ra, tempEquator.dec, localDate))
    }    
    createData(bodyObjects, setStarData)  
    updateData(Astronomy.Body.Moon, "Body: Moon");
  }
  else{
    setTimeout(dataUpdater, 500, setStarData)
  }
}

function App() {
  const [starData, setStarData] = useState({
    datasets: [{
      label: 'Dataset',
      data: [{
        x: 0,
        y: 0
      }],
      backgroundColor: 'rgb(255, 255,255)'
    }],
  });
  window.addEventListener("load", ()=>{
    const buttons = document.getElementsByClassName("rippleButton");
    for (const button of buttons) {
      button.addEventListener("click", createRipple);
    }
    dataUpdater(setStarData);
  });
  return (
  <div>
    <div className='dataSeparator'>
      <p>body coords in relation to observer</p>
      <div className='buttonContainer'>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Sun);}}>sun</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Mercury);}}>mercury</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Venus);}}>venus</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Moon);}}>moon</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Mars);}}>mars</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Jupiter);}}>jupiter</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Uranus);}}>uranus</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Saturn);}}>saturn</button>
        <button className = "rippleButton" onClick={()=>{updateData(Astronomy.Body.Neptune);}}>neptune</button>
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

    <div className='scatterplot'>
    <Scatterplot chartData={starData}></Scatterplot>
    </div>

    <div className='dataSeparator'>
      <p>local data/zenith coords</p>
      <hr/>
      <main id = "longlat"></main>
      <main id = "localDate"></main>
      <main id = "utcDate"></main>
      <main id = "RA"></main>
      <main id = "dec"></main>
      <hr/>
    </div>
  </div>
  );
}

export default App;
