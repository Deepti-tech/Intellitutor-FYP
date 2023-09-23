import React, { useState, useEffect, useRef } from 'react'
import Navbar, { linkList } from '../Components/Navbar'
import { get_plot } from '../js/httpHandler';
import { useNotifier } from '../js/utils';
import {Bar} from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
const Dashboard = ({}) => {
    const notifier = useNotifier();
    const [score, setScore] = useState([]);
    
    const [chartInstance, setChartInstance] = useState(null);
    useEffect(() => {
        get_plot(notifier)
          .then((response) => {
            setScore(response);
          })
          .catch((error) => {
            console.error('Error fetching audio data:', error);
          });
      }, [notifier]);
    
      useEffect(() => {
        if (score.length === 0) {
          return;
        }
        if (chartInstance) {
          chartInstance.destroy();
        }
        const ctx = document.getElementById('myChart').getContext('2d');
        const newChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['1', '2', '3', '4'],
            datasets: [{label: 'Speech Analysis', data: score.audioData, backgroundColor: ['rgba(75, 192, 192, 0.2)'], borderColor: ['rgb(75, 192, 192)'], borderWidth: 1,},],
          },
          options: {
            maintainAspectRatio: false,
          },
        });
        setChartInstance(newChartInstance);
      }, [score]); 
      const VideoScore = {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            label: 'Video',
            data: score.videoData,
            backgroundColor: ['black'],
            borderColor: ['Black'],
            borderWidth: 1,
          },
        ],
      };
      const AudioScore = {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            label: 'Speech',
            data: score.audioData,
            backgroundColor: ['black'],
            borderColor: ['black'],
            borderWidth: 1,
          },
        ],
      };
      const QnAScore = {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            label: 'Speech',
            data: score.audioData,
            backgroundColor: ['black'],
            borderColor: ['black'],
            borderWidth: 1,
          },
        ],
      };
    const Audiodata = {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            label: 'WPM',
            data: score.wpm,
            backgroundColor: ['rgba(75, 192, 192, 0.2)'],
            borderColor: ['rgb(75, 192, 192,1)'],
            borderWidth: 1,
          },
          {
            label: 'Pause',
            data: score.initial_pause_percent,
            backgroundColor: ['rgba(255, 99, 132, 0.2)'],
            borderColor: ['rgb(255, 99, 132,1)'],
            borderWidth: 1,
          },
          {
            label: 'Mute',
            data: score.mute_percent,
            backgroundColor: ['rgba(54, 162, 235, 0.2)'],
            borderColor: ['rgba(54, 162, 235, 1)'],
            borderWidth: 1,
          },
          {
            label: '# of Fillers',
            data: score.total_filler_words,
            backgroundColor: ['rgba(255, 206, 86, 0.2)'],
            borderColor: ['rgba(255, 206, 86, 1)'],
            borderWidth: 1,
          },
          {
            label: 'Fillers',
            data: score.filler_percent,
            backgroundColor: ['rgba(153, 102, 255, 0.2)'],
            borderColor: ['rgba(153, 102, 255, 1)'],
            borderWidth: 1,
          },
        ],
      };
      const Videodata = {
        labels: ['1', '2', '3', '4'],
        datasets: [
          {
            label: 'Happy',
            data: score.Happy,
            backgroundColor: ['rgba(75, 192, 192, 0.2)'],
            borderColor: ['rgb(75, 192, 192,1)'],
            borderWidth: 1,
          },
          {
            label: 'Sad',
            data: score.Sad,
            backgroundColor: ['rgba(255, 99, 132, 0.2)'],
            borderColor: ['rgb(255, 99, 132,1)'],
            borderWidth: 1,
          },
          {
            label: 'Angry',
            data: score.angry,
            backgroundColor: ['rgba(54, 162, 235, 0.2)'],
            borderColor: ['rgba(54, 162, 235, 1)'],
            borderWidth: 1,
          },
          {
            label: 'Surprise',
            data: score.Surprise,
            backgroundColor: ['rgba(255, 206, 86, 0.2)'],
            borderColor: ['rgba(255, 206, 86, 1)'],
            borderWidth: 1,
          },
          {
            label: 'Neutral',
            data: score.Neutral,
            backgroundColor: ['rgba(153, 102, 255, 0.2)'],
            borderColor: ['rgba(153, 102, 255, 1)'],
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
      const highestAudioScore = score.audioData?.reduce((a, b) => Math.max(a, b), 0) || 0;
      const highestVideoScore = score.videoData?.reduce((a, b) => Math.max(a, b), 0) || 0;
    //   const highestQnAScore = score.qnaData?.reduce((a, b) => Math.max(a, b), 0) || 0;
      
    return(
        <div className='page-wrapper'>
            <Navbar selectedPage={linkList.DASHBOARD} />
            <div className='page-container'>   
                <div style={{display: 'none'}}>
                    <canvas id='myChart' width='400' height='400'></canvas>
                </div> 
                <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px' }}>
                        Your Highest Scores
                    </span>
                <div style={{height:'200px', width:'100%', display: "flex", flexDirection: 'column', flexWrap: 'wrap', alignItems:'center', justifyItems: 'center', margin: '10px'}}>
                    <div style={{width: '300px', height: '300px', backgroundColor: '#eaeef4', borderRadius: 16,borderStyle:'solid', borderColor: 'black', padding: '5px 10px'}}>
                        <span style={{fontWeight: 'bolder', fontSize: '25px'}}>{Math.round(highestAudioScore)}</span><br/>
                        <span>Speech Analysis</span>
                        <div>
                            <Line data={AudioScore} options={{options}} height={400} width={700} />
                        </div>
                    </div>
                    <div style={{width: '300px', height: '300px', backgroundColor: '#eaeef4', borderRadius: 16, borderStyle:'solid', borderColor: 'black', padding: '5px 10px'}}>
                        <span style={{fontWeight: 'bolder', fontSize: '25px'}}>{Math.round(highestVideoScore)}</span><br/>
                        <span> Video Analysis</span>
                        <div>
                            <Line data={VideoScore} options={{options}} height={400} width={700} />
                        </div>
                    </div>
                    <div style={{width: '300px', height: '300px', backgroundColor: '#eaeef4', borderRadius: 16, borderStyle:'solid', borderColor: 'black', padding: '5px 10px'}}>
                        <span style={{fontWeight: 'bolder', fontSize: '25px'}}>{Math.round(highestAudioScore)}</span><br/>
                        <span> QnA Analysis</span>
                        <div>
                            <Line data={QnAScore} options={{options}} height={400} width={700} />
                        </div>
                    </div>
                </div>
                <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px', marginTop:'30px' }}>
                        Speech Analysis
                    </span>
                <div id='Speech_analysis'>
                    <Bar data={Audiodata} options={{options}} height={400} width={1000} />
                </div>
                <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px' }}>
                        Video Analysis
                    </span>
                <div id='Video_analysis'>
                    <Bar data={Videodata} options={{options}} height={400} width={1000} />
                </div>
            </div>
        </div>
    )
}
export default Dashboard