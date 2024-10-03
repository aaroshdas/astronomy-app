import './App.css';

import React, { useState } from 'react';
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css';

import {
  GeoapifyGeocoderAutocomplete,
  GeoapifyContext
} from '@geoapify/react-geocoder-autocomplete';



import axios from 'axios'

import Scatterplot from './js/Scatterplot.js';
import AutocompleteCities from './js/AutocompleteCities.js';
import AutocompleteBodies from './js/AutocompleteBodies.js';

import starFile from './stars/bsc5.json'

const Astronomy = require('./js/astronomy.js');


const elevation = 351
var localObserver = null

let timezone= -2

let selectedBody = null;
let currentDate = new Date(); 

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
    const date = currentDate;
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    var time = utc + (1000 * timezone);
    const newDate = new Date(time);
    return newDate;
  }
  else{
    return currentDate;
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
 
    const rawRA = Astronomy.SiderealTime(currentDate)+localObserver.longitude/15.0+240.0;
    const rightAscension = rawRA - Math.floor(rawRA/24.0)*24.0;  
  
    document.getElementById("longlat").innerHTML = ("Latitude/longtitude: " + localObserver.latitude.toFixed(4).toString() + ", "+ localObserver.longitude.toFixed(4).toString())
    document.getElementById("localDate").innerHTML = ("Local time: " + localDate.toString().slice(16,25))
    document.getElementById("utcDate").innerHTML = ("UTC time: " + currentDate.toUTCString().slice(16,25))
    document.getElementById("date").innerHTML = ("Local date: " + localDate.toString().slice(0, 16)) 
    document.getElementById("RA").innerHTML = ("Local right ascension: " + createHourString(rightAscension.toFixed(5)))
    document.getElementById("dec").innerHTML = ("Local declination: " + declination.toFixed(5)) 
    
  }  
}

class Body{
  constructor(label, ra, dec, mag, importance){
      this.label = label;
      let bodyData = Astronomy.Horizon(currentDate, localObserver, ra, dec, 'normal');
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
            pointRadius: bodyData.importance+ importanceOffset,
          });
        }
      }
      data.push({
        data:[
          {x:0, y:-1},
          {x:0.12,y:-0.99277},
          {x:0.70711,y:-0.70711},
          {x:1, y:0},
          {x:0.70711,y:0.70711},
          {x:0, y:1},
          {x:-0.70711,y:0.70711},
          {x:-1, y:0},
          {x:-0.70711,y:-0.70711},
          {x:-0.12,y:-0.99277},
          {x:0, y:-1},
        ],
        tension: 0.4,
        pointRadius:0,
        borderColor: 'rgba(32,32,32, 1)',
        borderWidth:0.4,
        showLine: true
        
      })
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
      let mag = Astronomy.Illumination(rawBodies[3], currentDate)["mag"]
      let tempEquator = (Astronomy.Equator(rawBodies[i], currentDate, localObserver, true, false));
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
function bortleClassToVMag(bortle){
  let val = parseInt(bortle)
  if(val <1){return 9;}
  else if(val <= 1){return 7.6;}
  else if(val <=2){return 7.1;}
  else if(val <=3){return 6.6;}
  else if(val <=4){return 6.3;}
  else if(val <=4.5){return 6.1;}
  else if(val <=5){return 5.6;}
  else if(val <=6){return 5.1;}
  else if(val <=7){return 4.6;}
  else if(val <=8){return 4.1;}
  else if(val <=9){return 4.0;}
  return 3;
}

function getStarAPI(displaySettings, setStarData){
  // console.log(document.getElementById("star-API-name").value)
  let options = {
    method: 'GET',
    headers: { 'x-api-key': 'vffoINVuhjl5U06QJ8cIsQ==Zr401BBv29T4cfew' }
  }
  const valName = document.getElementById("star-API-name").value
  let url = `https://api.api-ninjas.com/v1/stars?name=${valName}`
  
  fetch(url,options)
  .then(res => res.json()) 
  .then(async data => {
    const ra =Number(data[0]['right_ascension'].slice(0, 2))+ (Number(data[0]['right_ascension'].slice(4, 6))/60) +(Number(data[0]['right_ascension'].slice(8, 10))/60)*0.01
    //let dec = Number(data[0]['declination'].slice(0, 2))+ (Number(data[0]['declination'].slice(4, 6))/60) +(Number(data[0]['declination'].slice(8, 10))/60)*0.01
    let decCoeff = -1
    if(data[0]['declination'].slice(0,1) ===`+`){
      decCoeff = 1
    }
    const dec = (decCoeff*Number(data[0]['declination'].slice(1, 3))+decCoeff*Number(data[0]['declination'].slice(5,7))*0.01 +decCoeff*Number(data[0]['declination'].slice(9,12))*0.0001)
    let mag = 6
    if(data[0]['apparent_magnitude'].slice(0,1) === "−"){
      mag =-1* Number(data[0]['apparent_magnitude'].slice(1,data[0]['apparent_magnitude'].length))
    }
    else{
      mag = Number(data[0]['apparent_magnitude'])
    }
    const newStar = new Body(data[0]['name'], ra, dec, mag, 1)
    console.log(newStar)
    updateStarData(newStar)
    if(newStar.altitude >0){
    }
    else{
      selectedBody = null;
    }
    const bodyObjects = await getBodyArray(displaySettings)
    bodyObjects.push(newStar)
    createData(bodyObjects, setStarData)
    //see setUpdateDataFromSuggestions
  })
  .catch(err => {
      console.log(`error ${err}`)
  }); 
  document.getElementById("star-API-name").value = ""
}
function reformatStarData(starData){
  const newL = starData['datasets'].slice(0, -1)
  return {datasets: newL}
}

function setDate(setStarData, displaySettings){
  let year = parseInt(document.getElementById("datePicker").value.slice(0,4))+0;
  let month = parseInt(document.getElementById("datePicker").value.slice(5,7))-1;
  let day = parseInt(document.getElementById("datePicker").value.slice(8,10))+0;
  console.log(year, month, day);
  let hour = parseInt(document.getElementById("hour").value)+0;
  let min = parseInt(document.getElementById("min").value)+0;
  if(hour < 0 || hour > 24 || isNaN(hour)){hour = 12;}
  if(min < 0 || min >= 60 || isNaN(hour)){min = 0;}
  
  let newDate = new Date(year, month, day, hour,min)
  console.log(newDate)
  currentDate = newDate; 
  dataUpdater(setStarData,displaySettings);
}

let callLoadOnce = false;
function App() {
  const [renderGraph, setRenderGraph] = useState(false);
  const [starData, setStarData] = useState({datasets: [{label: 'horizon scatterplot',data: [{}],backgroundColor: 'rgb(255, 255,255)'}],});
  // ARRAY [use extra stars, only named stars]
  const [displaySettings, setDisplaySettings] = useState([true, true, 8])
  window.addEventListener("load", ()=>{
      dataUpdater(setStarData, displaySettings);
      if(callLoadOnce === false){
        document.getElementById("show-big-horizon").addEventListener("click", ()=>{
          if(document.getElementById("big-scattorplot").classList.contains('dropDownFull')){
            document.getElementById("big-scattorplot").classList.remove('dropDownFull')
          }else{
            document.getElementById("big-scattorplot").classList.add('dropDownFull')
          }
        });
        document.getElementById("address").addEventListener("click", ()=>{
          if(document.getElementById("address-dropdown").classList.contains('dropDownFullHeight')){
            document.getElementById("address-dropdown").classList.remove('dropDownFullHeight')
          }else{
            document.getElementById("address-dropdown").classList.add('dropDownFullHeight')
          }
        });
        document.getElementById("timeAndDate").addEventListener("click", ()=>{
          if(document.getElementById("time-date-dropdown").classList.contains('dropDownFullHeight')){
            document.getElementById("time-date-dropdown").classList.remove('dropDownFullHeight')
          }else{
            document.getElementById("time-date-dropdown").classList.add('dropDownFullHeight')
          }
        });
        callLoadOnce = true;
      }
      
  });

  return (
  <div>
    <div className='dataSeparator'>
      <div className='cityDataContainer'>
      <p>local data/zenith coords</p>
      <AutocompleteCities setStarData={setStarData} displaySettings= {displaySettings}/>
      <div>
        <button id="address" className='button addressButton'><span>Find by exact address</span></button>
        <button id="timeAndDate" className='button addressButton'><span>Set date and time</span></button>
      </div>
      
      <div id = "time-date-dropdown" className = "dropDownSmallHeight date-dropdown-container">
        <input defaultValue={currentDate} id = "datePicker" className = "dateBox" type = "date"/>
        <input id = "hour" className = "dateInputBox" type = "number" min = "0" max = "24" placeholder='hour'/>
        <input id = "min" className = "dateInputBox" type = "number" min = "0" max = "60" placeholder='min'/>
        
        <button className='button' onClick={()=>{setDate(setStarData, displaySettings)}}><span>submit</span></button>
      </div>

      <div id = "address-dropdown" className='addressAutocomplete dropDownSmallHeight'>
        <GeoapifyContext apiKey="e546f68274a546ac8129e9e82a49d8b4">
          <GeoapifyGeocoderAutocomplete id = "address-autocomplete"
            placeholder='Find a specific address...'
            placeSelect={(value)=>{
              if(value !== null){
                console.log(value)
                if(value["bbox"] !== undefined){
                  setLocation(value["bbox"][1], value["bbox"][0]);
                  dataUpdater(setStarData,displaySettings);
                  if(document.getElementById("address-dropdown").classList.contains('dropDownFullHeight')){
                    document.getElementById("address-dropdown").classList.remove('dropDownFullHeight')
                  }
                }
                else if(value["geometry"] !== undefined){
                  setLocation(value["geometry"]['coordinates'][1], value["geometry"]['coordinates'][0]);
                  dataUpdater(setStarData,displaySettings);
                  if(document.getElementById("address-dropdown").classList.contains('dropDownFullHeight')){
                    document.getElementById("address-dropdown").classList.remove('dropDownFullHeight')
                  }
                }
              }
            }}
          />
        
        </GeoapifyContext>

      </div>
      <hr className = 'cityDataLine' />
      <main id = "longlat"></main>
      
      <main id = "localDate"></main>
      <main id = "utcDate"></main>
      <main id = "date"></main>
      <main id = "RA"></main>
      <main id = "dec"></main>
      <hr className = 'cityDataLine' />

      </div>
    </div>

    <div>
      <div className='centerButton'>
        <button id="show-big-horizon" style={{padding:"0.75%"}} className='button' onClick={()=>{setRenderGraph(!renderGraph)}}><span>Display complete horizon</span></button>
      </div>

      <div className='biggerScatterplot'>
        <div id ="big-scattorplot" className = "dropDownSmall" style={{display:'none'}}>
          <Scatterplot chartData={reformatStarData(starData)} render={renderGraph}></Scatterplot>
        </div>
      </div>

    </div>

    <div className='bottomInfoContainer'>

      <div className='scatterplot'>
        <Scatterplot chartData={starData} render={true}></Scatterplot>
      </div>
    
      <div className='starInfo'>
        <p>body coords in relation to observer</p>
        <div className='buttonContainer'>
          <AutocompleteBodies suggestionsPromise={getBodySuggestions(displaySettings)} displaySettings={displaySettings} setStarData={setStarData}/>
        </div>
        <div className='getStarByNameContainer'>
          <main>get star by exact name:</main>
          <input className = "starInputBox" id = "star-API-name" type = "text" placeholder='get star by name (i.e. vega, sirius)...'/>
          <button className='button' onClick={()=>{getStarAPI(displaySettings, setStarData)}}><span>submit</span></button>
          <hr className='infoDataLine'/>
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
          <input className= "inputBox" id = "minMag" defaultValue={displaySettings[2]} type = "number" max = "12" placeholder='max visual magnitude...'/>
          <button className='button' onClick={()=>{setDisplaySettings([displaySettings[0],displaySettings[1], document.getElementById("minMag").value]);dataUpdater(setStarData, [displaySettings[0], displaySettings[1], document.getElementById("minMag").value]) }}><span>submit</span></button>
          
          <main>use bortle class:</main>
          <input className= "inputBox" id = "bortle" defaultValue={1} type = "number" max = "9" min="1" placeholder='bortle class...'   />
          <button className='button' onClick={()=>{
            setDisplaySettings([displaySettings[0],displaySettings[1], bortleClassToVMag(document.getElementById("bortle").value)]);
            dataUpdater(setStarData, [displaySettings[0], displaySettings[1], bortleClassToVMag(document.getElementById("bortle").value)]); 
            document.getElementById("minMag").value = bortleClassToVMag(document.getElementById("bortle").value)
          }}><span>submit</span></button>
        </div>
        <main id = "body"></main>
        <main id = "relToHorizon"></main>
        <main id = "mag"></main>
        <main id = "bodyRA"></main>
        <main id = "bodyDec"></main>
        <main id = "azimuth"></main>
        <main id = "altitude"></main>
        <hr className='infoDataLine'/>
      </div>
    </div>
  </div>
  );
}

export default App;
