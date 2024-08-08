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
  } from 'chart.js';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
function Scatterplot( {chartData} ){
    return(
        <div>
            <Scatter
                data={chartData}
                options={{
                    plugins:{
                        title:{display:true, text:"horizon scatterplot"}
                    },
                    legend:{
                        display:false
                    }
                }}
            />
        </div>
    )
}
export default Scatterplot