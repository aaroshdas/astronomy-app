import './App.css';

import React from 'react'

import axios from 'axios'

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

function App() {
  navigator.geolocation.getCurrentPosition(function (position) {
    const Astronomy = require('./astronomy.js');

    const declination= position.coords.latitude;

    
    // setInterval(()=>{
      const localDate = new Date();
      
      const rawRA = Astronomy.SiderealTime(localDate)+position.coords.longitude/15.0+240.0;
      const rightAscension = rawRA - Math.floor(rawRA/24.0)*24.0;
      
      let url = `https://api.open-elevation.com/api/v1/lookup?locations=${position.coords.latitude},${position.coords.longitude}`
      
      axios.get(url)
      .catch(function(error){
        console.log(error)
      })
      .then((response => {
        console.log("called")
        var localObserver = new Astronomy.Observer(position.coords.latitude, position.coords.longitude, response.data['results'][0]['elevation'])
        
        var body = (Astronomy.Equator(Astronomy.Body.Sun, localDate, localObserver, true, false))
        document.getElementById("body").innerHTML = "body: sun";

        var horData = Astronomy.Horizon(localDate, localObserver, body.ra, body.dec, 'normal');
        document.getElementById("azimuth").innerHTML = "Azimuth: "+ horData.azimuth.toFixed(5);
        document.getElementById("altitude").innerHTML = "Altitude: " + horData.altitude.toFixed(5);
      }));
      document.getElementById("longlat").innerHTML = ("Latitude/Longtitude: " + position.coords.latitude.toFixed(4).toString() + ", "+ position.coords.longitude.toFixed(4).toString())
      
      document.getElementById("localDate").innerHTML = ("Local time: " + localDate.toString().slice(16,25))
      document.getElementById("utcDate").innerHTML = ("UTC time: " + localDate.toUTCString().slice(16,25))
      
      document.getElementById("RA").innerHTML = ("Local right ascension: " + createHourString(rightAscension.toFixed(5)))
      document.getElementById("rawRA").innerHTML = ("Raw local right ascension: " + (rightAscension.toFixed(5)))
      
      document.getElementById("dec").innerHTML = ("Local declination: " + declination.toFixed(5))
    // },1000)

  });
  return (
    <div>
      <h3>local data/zenith coords</h3>
      <div className='dataSeparator'>
        <main id = "longlat"></main>
        <main id = "localDate"></main>
        <main id = "utcDate"></main>
        <main id = "RA"></main>
        <main id = "rawRA"></main>
        <main id = "dec"></main>
      </div>

      <h3>body coords in relation to observer</h3>
      <div className='dataSeparator'>
        <main id = "body"></main>
        <main id = "azimuth"></main>
        <main id = "altitude"></main>
      </div>
    </div>
  );
}

export default App;
