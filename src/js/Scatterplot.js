import React from "react";
import { Scatter } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  } from 'chart.js';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
function Scatterplot( {chartData, render} ){
    if(render===false){
        return(<div></div>);
    }
    return(
        <div>
            <Scatter
                data={chartData}
                options={{
                    plugins:{
                        title:{display:true, text:"horizon scatterplot"},
                        legend:{
                            display:false
                        }
                        
                    },   
                    aspectRatio:1,                    
                    scales:{
                        x: {
                            min: -1,
                            steps: 0.1,
                            stepValue: 0.1,
                            max: 1,  
                            title:{
                                display:true,
                                text:"S",
                                color:"white"
                            }
                        },
                        y:{
                            min: -1,
                            steps: 0.1,
                            stepValue: 0.1,
                            max: 1,
                            title:{
                                display:true,
                                text:"W",
                                color:"white"
                            }
                        }
                    }
                }}
            />
        </div>
    )
}
export default Scatterplot