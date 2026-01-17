import { useState } from "react";

import countryStateCityList from '../data/cities/city-list-countries.txt'

import { dataUpdater, setLocation } from "../App";

import "../css/Autocomplete.css"

function AutocompleteCities({setStarData, displaySettings}){
    const [suggestions, setSuggestions] = useState([])
    const [lastValue, setLastValue] = useState(0)
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [inputValue, setInputValue] = useState('')

    window.addEventListener("load", (event) => {
        fetch(countryStateCityList)
        .then(r => r.text())
        .then( text =>{
            let splitT = text.split("\n")

            const suggestionArray  = []
            for(let i =0; i < splitT.length; i++){
                suggestionArray.push(splitT[i].trim().split(",").toString())
            }
            setSuggestions(suggestionArray);
        })
    });
    
    const handleChange = (event) => {
        setInputValue(event.target.value);
        setLastValue(event.target.value.length);
        let filtered = []
        if(event.target.value.length > 4){
 
            if(lastValue >= event.target.value.length){
                filtered = suggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
            }
            else{
                filtered = filteredSuggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
            }
        }
        else if(event.target.value.length === 4){
            filtered = suggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
        }
        else{
            setFilteredSuggestions([])
        }
        
        setFilteredSuggestions(filtered);
    }
    const handleSelect = (value) =>{
        setFilteredSuggestions([]);
        setLocation(Number(value.split(",")[1]), Number(value.split(",")[2]))
        dataUpdater(setStarData,displaySettings)
        setInputValue("")
    }

    return(
        <div className="autocomplete-city-container">
            <input className="autocomplete-input"
                id = 'searchBar'
                type="text"
                autoComplete="off"
                value={inputValue}
                onChange={handleChange}
                placeholder="Search cities..."
            />  
            <ul className="autocomplete-suggestions-list">
            {filteredSuggestions.slice(0,7).map((suggestion, index) => (
                <li key = {index} className="autocomplete-suggestions-item" onClick={()=>handleSelect(suggestion)}>
                    {suggestion.split(",")[0].slice(0,1)}{suggestion.split(",")[0].slice(1, suggestion.length).toLowerCase()}, {suggestion.split(",")[3]}

                </li>
            ))}
            </ul>
        </div>
    );
}
export default AutocompleteCities;