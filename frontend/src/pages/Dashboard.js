import React, { useState, useEffect, useRef } from 'react'
import Navbar, { linkList } from '../Components/Navbar'
import { get_plot } from '../js/httpHandler';
import { useNotifier } from '../js/utils';
import {Bar} from 'react-chartjs-2'

const Dashboard = ({}) => {
    const notifier = useNotifier();
    const [audioData, setAudioData] = useState([]);
    
  useEffect(() => {
    get_plot(notifier)
      .then((response) => {
        setAudioData(response);
      })
      .catch((error) => {
        console.error('Error fetching audio data:', error);
      });
  }, [notifier]);
  console.log(audioData)
    const data = {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            label: 'Audio Analysis',
            data: audioData,
            backgroundColor: [
            //   'rgba(255, 99, 132, 0.2)',
            //   'rgba(255, 159, 64, 0.2)',
            //   'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
            ],
            borderColor: [
            //   'rgb(255, 99, 132)',
            //   'rgb(255, 159, 64)',
            //   'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
            ],
            borderWidth: 1,
          },
        ],
      };
    
      const options = {
        maintainAspectRatio: false,
        scales: {
            y: {
              beginAtZero: true
            }
          },
      };
    
    return(
        <div className='page-wrapper'>
            <Navbar selectedPage={linkList.DASHBOARD} />
            <div className='page-container'>
                <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px' }}>
                    Prepare to Shine!
                </span>    
                <Bar data={data} options={{options}} height={400} width={600} />
            </div>
        </div>
    )
}
export default Dashboard