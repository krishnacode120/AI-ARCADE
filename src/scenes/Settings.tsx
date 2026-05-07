import React from 'react';
import { RetroButton } from '../components/RetroButton';
import { Panel } from '../components/Panel';
import { useSettings } from '../store';
import { soundManager } from '../lib/sound';

interface Props {
  changeScene: (scene: string) => void;
}

export default function Settings({ changeScene }: Props) {
  const { musicVol, sfxVol, crtEnabled, theme, setMusicVol, setSfxVol, setCrtEnabled, setTheme } = useSettings();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="font-retro text-4xl text-[var(--color-neon-lime)] text-shadow-lime mb-8 text-center pt-10 md:pt-0">
        SETTINGS
      </h1>
      
      <Panel className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h3 className="font-retro text-xl mb-4 text-gray-300">SFX VOLUME: {Math.round(sfxVol * 100)}%</h3>
          <input 
            type="range" min="0" max="1" step="0.1" 
            value={sfxVol} 
            onChange={(e) => {
              setSfxVol(parseFloat(e.target.value));
              soundManager.click();
            }}
            className="w-full accent-[var(--color-neon-magenta)] cursor-pointer"
          />
        </div>
        
        <div>
          <h3 className="font-retro text-xl mb-4 text-gray-300">MUSIC VOLUME: {Math.round(musicVol * 100)}%</h3>
          <input 
            type="range" min="0" max="1" step="0.1" 
            value={musicVol} 
            onChange={(e) => {
              setMusicVol(parseFloat(e.target.value));
            }}
            className="w-full accent-[var(--color-neon-cyan)] cursor-pointer"
          />
        </div>

        <div className="flex justify-between items-center mt-4">
            <h3 className="font-retro text-xl text-gray-300">CRT EFFECTS:</h3>
            <RetroButton 
                className="text-[var(--color-neon-lime)]" 
                onClick={() => setCrtEnabled(!crtEnabled)}
            >
                {crtEnabled ? 'ENABLED' : 'DISABLED'}
            </RetroButton>
        </div>

        <div className="flex flex-col mt-4">
            <h3 className="font-retro text-xl text-gray-300 mb-4">COLOR THEME:</h3>
            <div className="grid grid-cols-2 gap-4">
                <RetroButton active={theme === 'default'} onClick={() => setTheme('default')}>CYBERPUNK</RetroButton>
                <RetroButton active={theme === 'matrix'} onClick={() => setTheme('matrix')}>MATRIX</RetroButton>
                <RetroButton active={theme === 'vaporwave'} onClick={() => setTheme('vaporwave')}>VAPORWAVE</RetroButton>
                <RetroButton active={theme === 'sunset'} onClick={() => setTheme('sunset')}>SUNSET</RetroButton>
            </div>
        </div>
      </Panel>
      
      <div className="mt-8 self-center md:self-start">
        <RetroButton onClick={() => changeScene('MENU')}>SAVE & BACK</RetroButton>
      </div>
    </div>
  );
}
