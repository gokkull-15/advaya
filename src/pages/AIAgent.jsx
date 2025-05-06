import React, { useEffect } from 'react';
import { Loader } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from './Experience';
import { UI } from './UI';
import './ai.css';

function AIAgent() {
  useEffect(() => {
    const urlParts = window.location.pathname.split('/');
    const userid = urlParts[1];
    if (userid) {
      localStorage.setItem('gfuserid', userid);
    }
  }, []);

  return (
    <div className="ai">
      {/* Background is now set on the container itself */}
      
      <Loader />
      <Leva hidden />
      
      {/* Canvas container */}
      <div className="canvas-wrapper">
        <Canvas
          shadows
          camera={{ position: [0, 0, 1], fov: 30 }}
        >
          <Experience />
        </Canvas>
      </div>
      
      {/* UI overlay */}
      <div className="ui-overlay">
        <UI />
      </div>
    </div>
  );
}

export default AIAgent;