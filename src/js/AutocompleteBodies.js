import { useState } from "react";

import "../css/Autocomplete.css"
import { setUpdateDataFromSuggestion } from "../App";

function AutocompleteBodies({suggestionsPromise,setStarData,displaySettings}){
    const [lastValue, setLastValue] = useState(0)
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [inputValue, setInputValue] = useState('')
    

    let suggestions = []
    if(suggestionsPromise !== undefined){
        suggestionsPromise.then((value)=>{
            suggestions= value;  
    })};
    const handleChange = (event) => {

        setInputValue(event.target.value);
        setLastValue(event.target.value.length);
        let filtered = []
        if(event.target.value.length > 2){
 
            if(lastValue >= event.target.value.length){
                filtered = suggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
            }
            else{
                filtered = filteredSuggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
            }
        }
        else if(event.target.value.length === 2){
            filtered = suggestions.filter(suggestion => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
        }
        else{
            setFilteredSuggestions([])
        }
        
        setFilteredSuggestions(filtered);
    }
    const handleSelect = (value) =>{
        setFilteredSuggestions([]);
        setUpdateDataFromSuggestion(value, setStarData,displaySettings)
        setInputValue("")
    }

    return(
        <div className="autocomplete-body-container">
            <input className="autocomplete-input"
                id = 'searchBar'
                type="text"
                autoComplete="off"
                value={inputValue}
                onChange={handleChange}
                placeholder="Search stars..."
            />  
            <ul className="autocomplete-suggestions-list">
            {filteredSuggestions.slice(0,7).map((suggestion, index) => (
                <li key = {index} className="autocomplete-suggestions-item" onClick={()=>handleSelect(suggestion)}>
                    {suggestion.split(",")[0]}
                </li>
            ))}
            </ul>
        </div>
    );
}
export default AutocompleteBodies;