import React, { useState, useEffect, useRef } from 'react'
import Navbar, { linkList } from '../Components/Navbar'
import InputBox from '../Components/InputBox';
import { useNavigate } from 'react-router-dom';
import { useNotifier } from '../js/utils';
import {
    getPracticeStreamId, sendBlobData,
    scheduleCandidatePracticeInterview
} from '../js/httpHandler';

var videoPath, id

const CandidatePracticeInterview = ({ }) => {
    const [permissionError, setPermissionError] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [streamId, setStreamId] = useState('');
    
    const videoFrameRef = useRef();
    const notifier = useNotifier();
    const navigate = useNavigate();
     
    const [isRecording, setIsRecording] = useState(false);

    const send_blobs = async (blob_data) => {
        if (streamId) {
            sendBlobData(notifier, streamId, blob_data)
        } else {
            throw new Error('Stream Id not present')
        }
    }
    
    const schedulePracticeInterview = async () => {
        const payload = {
          'time': parseInt(Date.parse(new Date) / 1000) + 18000,
        //   'designation': role
        }
        const response = await scheduleCandidatePracticeInterview(notifier, payload)
        if (response){
            notifier('Interview starts now...');
        }
        id = response
        allowRecording()
        videoPath = 'uploads/' + id + '.webm'
      }

    useEffect(() => {
        if (mediaRecorder && streamId) {
            mediaRecorder.ondataavailable =
                async (e) => {
                    const reader = new FileReader();
                    reader.onloadend = (_) => {
                        const result = reader.result;
                        const blob_data = new Blob([result], { type: 'application/octet-stream' });
                        send_blobs(blob_data);
                    }
                    reader.readAsArrayBuffer(e.data);
                };
            mediaRecorder.start(5000);
        }
    }, [mediaRecorder, streamId])

    const allowRecording = () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(async (permissionObj) => {
                document.getElementById('role_info').style.display = 'none';
                document.getElementById('questions').style.display = 'flex';
                document.getElementById('complete').style.opacity = '1';
                setPermissionGranted(true);
                setIsRecording(true);
                videoFrameRef.current.srcObject = permissionObj;
                
                const _streamId = await getPracticeStreamId(notifier,id);
                if (_streamId) {
                    setStreamId(_streamId);
                }
                setMediaRecorder(new MediaRecorder(videoFrameRef.current.srcObject, { mimeType: 'video/webm' }));
            })
            .catch((error) => {
                console.error(error)
                setPermissionError(true);
            })
    };
    
    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false); 
        }
        return navigate('/practiceInterviewAnalysis', {state: {videoPath: videoPath, id: id}});
    };

    return (
        <div className='page-wrapper'>
            <Navbar selectedPage={linkList.PRACTICE_INTERVIEW} />
            <div className='page-container'>
            <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px' }}>
                    Prepare to Shine!</span>
                <div className='interview-list-container'>
                    <div className='interview-item'>
                    <div id='role_info'>
                        <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Enter the role you are preparing for...</span>
                        <InputBox style={{ height: '35px' }} clsName='custom-input-style' />
                    </div>
                    <div id='questions' style={{display: 'none'}}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Questions...</span>
                        
                    </div>
                    {(!permissionGranted) &&
                        <>
                            <button className="custom-purple" style={{ float: 'right', marginRight: '20px', marginTop: '5px' }} onClick={schedulePracticeInterview}> Start</button>
                        </>
                    }
                    <button className='custom-blue' id='complete' style={{ float: 'right', marginRight: '20px', marginTop: '5px', opacity: '0' }} onClick={stopRecording}> Complete Interview</button>
                    {permissionError &&
                        <div className='alert-message'>
                            <span> Error: User did not grant camera permission</span>
                        </div>}
                    </div>
                </div>
                <div id="recording_frame" className={`video-container ${(permissionGranted) ? 'visible' : ''}`}>
                    <video className='video-frame' autoPlay onLoadStart={(e) => { e.currentTarget.volume = 0 }} ref={videoFrameRef}></video>
                </div>
                
            </div>
        </div>  
    )
}

export default CandidatePracticeInterview