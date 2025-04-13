'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Style from './main.module.css';

interface Track {
  name: string;
  file: {
    data: number[];
  };
  type: string;
}

export const Main = () => {
  const [tracks, setTracks] = useState<Track[]>(
    JSON.parse(localStorage.getItem('keplayerTracks') || '[]')
  );
  const [currentTrack, setCurrentTrack] = useState<number>(-1);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    // Загрузка из localStorage только на клиенте
    if (typeof window !== 'undefined') {
      const savedTracks: Track[] = JSON.parse(
        localStorage.getItem('keplayerTracks') || '[]'
      );
      const urls: string[] = [];
      
      savedTracks.forEach(track => {
        if (track.file?.data) {
          const blob = new Blob([new Uint8Array(track.file.data)], { 
            type: track.type 
          });
          urls.push(URL.createObjectURL(blob));
        }
      });
      
      setBlobUrls(urls);
      setTracks(savedTracks);
      if (savedTracks.length > 0 && currentTrack === -1) {
        setCurrentTrack(0);
      }
    }
  }, []);

  const updateTrackList = (newTracks: Track[]) => {
    const urls: string[] = [];
    const updatedTracks = newTracks.map(track => {
      if (track.file) {
        const blob = new Blob([new Uint8Array(track.file.data)], {
          type: track.type
        });
        const url = URL.createObjectURL(blob);
        urls.push(url);
        return {
          ...track,
          url
        };
      }
      return track;
    });
    
    setBlobUrls(urls);
    setTracks(updatedTracks);
    
    // Сохранение только на клиенте
    if (typeof window !== 'undefined') {
      localStorage.setItem('keplayerTracks', JSON.stringify(updatedTracks));
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newTracks = [...tracks];

    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newTracks.push({
              name: file.name,
              file: {
                data: Array.from(new Uint8Array(e.target.result as ArrayBuffer)),
              },
              type: file.type
            });
            updateTrackList(newTracks);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const playTrack = (index: number) => {
    if (index >= 0 && index < tracks.length && audioRef.current) {
      setCurrentTrack(index);
      audioRef.current.src = blobUrls[index];
      audioRef.current.play().catch(console.error);
      if (selectRef.current) {
        selectRef.current.selectedIndex = index + 1;
      }
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current?.src) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleNextTrack = () => {
    if (!tracks.length) return;
    const newIndex = (currentTrack + 1) % tracks.length;
    playTrack(newIndex);
  };

  return (
    <div className={Style.wrapper}>
      <h1>KePlayer</h1>
      <div className={Style.controls}>
        <input
          type="file"
          accept="audio/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <button onClick={handlePlayPause}>
            ▶️ / ⏸️
        </button>
        <button onClick={handleNextTrack}>Следующий ▶️</button>
      </div>
      <div className={Style.elect}>
        <select
          ref={selectRef}
          onChange={(e) => playTrack(parseInt(e.target.value))}
        >
          <option disabled selected>Выбери трек</option>
          {tracks.map((track, index) => (
            <option key={index} value={index}>
              {track.name}
            </option>
          ))}
        </select>
      </div>
      <audio
        ref={audioRef}
        controls
        onEnded={handleNextTrack}
      />
    </div>
  );
};