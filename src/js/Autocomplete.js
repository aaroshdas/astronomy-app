import { useState } from "react";

import countryStateCityList from '../cities/city-list.txt'

import { dataUpdater, setLocation } from "../App";

import "../css/Autocomplete.css"

function Autocomplete({setData}){
    const [suggestions, setSuggestions] = useState([])
    const [lastValue, setLastValue] = useState(0)
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [inputValue, setInputValue] = useState('')

    window.addEventListener("load", (event) => {
        console.log("created city list")
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
        if(event.target.value.length > 5){
 
            if(lastValue >= event.target.value.length){
                filtered = suggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
            }
            else{
                filtered = filteredSuggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
            }
        }
        else if(event.target.value.length === 5){
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
        dataUpdater(setData)
        setInputValue("")
    }

    return(
        <div className="autocomplete-container">
            <input className="autocomplete-input"
                id = 'searchBar'
                type="text"
                autoComplete="false"
                value={inputValue}
                onChange={handleChange}
                placeholder="Search..."
            />  
            <ul className="autocomplete-suggestions-list">
            {filteredSuggestions.slice(0,7).map((suggestion, index) => (
                <li key = {index} className="autocomplete-suggestions-item" onClick={()=>handleSelect(suggestion)}>
                    {suggestion.split(",")[0].toLowerCase()}

                </li>
            ))}
            </ul>
        </div>
    );
}
export default Autocomplete;