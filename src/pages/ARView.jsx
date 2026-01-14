import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';
import AROverlay from '../components/AR/AROverlay';
import HeroChat from '../components/AR/HeroChat';
import { toast } from 'react-hot-toast';

const ARView = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(true);
    const [targetFound, setTargetFound] = useState(false);
    const [heroMessages, setHeroMessages] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const sceneRef = useRef(null);
    const arSystemRef = useRef(null);

    // Initial greeting when target is found
    const handleTargetFound = () => {
        console.log("Target Found!");
        setTargetFound(true);
        setScanning(false);
        setHeroMessages([{
            role: 'hero',
            content: "Üdvözlet vitéz! Jurisics Miklós vagyok. Látom furcsa szerkezet van a kezedben. Ostromra készülünk?"
        }]);
        toast.success("Jurisics Miklós érzékelve!", { icon: '🏰' });
    };

    const handleSimulate = () => {
        setIsSimulating(true);
        handleTargetFound();
    };

    const handleTargetLost = () => {
        // If simulating, don't lose target
        if (isSimulating) return;

        console.log("Target Lost!");
        setTargetFound(false);
        setScanning(true);
    };

    const handleUserMessage = async (text) => {
        // Add user message
        const newMessages = [...heroMessages, { role: 'user', content: text }];
        setHeroMessages(newMessages);
        setIsThinking(true);

        // "AI" Logic - Keyword Matching for better immersion
        const generateResponse = (input) => {
            const lowerInput = input.toLowerCase();

            if (lowerInput.includes('bor') || lowerInput.includes('iszol')) return "A kőszegi bor híresen jó! De most, a csata előtt csak vizet iszom. Majd a győzelemre koccintunk!";
            if (lowerInput.includes('ostrom') || lowerInput.includes('támadás')) return "Kemény napok várnak ránk. Ibrahim nagyvezír serege hatalmas, de a falaink erősek, és a szívünk még erősebb!";
            if (lowerInput.includes('török') || lowerInput.includes('ellenség')) return "A törökök sokan vannak, mint a pelyva. De nem a létszám számít, hanem a hit és a bátorság!";
            if (lowerInput.includes('hogy') && lowerInput.includes('vagy')) return "Fáradt vagyok, barátom. Napok óta nem aludtam. A felelősség súlya nyomja a vállam, de kitartok.";
            if (lowerInput.includes('győztetek') || lowerInput.includes('nyert')) return "Ez még a jövő titka... De én hiszek benne, hogy Isten nem hagy el minket. Augusztus 30-ig ki kell tartanunk!";
            if (lowerInput.includes('segít') || lowerInput.includes('tenni')) return "Imádkozz értünk! És ha van nálad lőpor vagy élelem, azt szívesen vesszük. A készleteink fogyóban.";
            if (lowerInput.includes('köszönöm')) return "Nincs mit köszönni. A haza védelme kötelességünk. Élj békében!";

            // Default fallbacks
            const fallbacks = [
                "Érdekes kérdés, de most a védműveket kell ellenőriznem.",
                "Erről most nem beszélhetek. A falakon van szükség rám.",
                "Bocsáss meg, a gondolataim máshol járnak. Az ostrom minden figyelmemet leköti.",
                "Nem értem pontosan... Tán valami jövőbeli nyelven szólsz?"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        };

        // Simulate AI Response delay
        setTimeout(() => {
            const responseText = generateResponse(text);
            setHeroMessages(prev => [...prev, { role: 'hero', content: responseText }]);
            setIsThinking(false);
        }, 1200);
    };

    useEffect(() => {
        const sceneEl = sceneRef.current;
        if (sceneEl) {
            const arSystem = sceneEl.systems["mindar-image-system"];
            arSystemRef.current = arSystem;

            sceneEl.addEventListener("arReady", (event) => {
                console.log("MindAR is ready");
            });

            const target = document.querySelector('#target-jurisics');
            if (target) {
                target.addEventListener("targetFound", handleTargetFound);
                target.addEventListener("targetLost", handleTargetLost);
            }
        }

        return () => {
            try {
                if (arSystemRef.current) {
                    arSystemRef.current.stop(); // Stop camera on unmount
                }
            } catch (error) {
                // Ignore specific 'pause' error from MindAR on unmount, it's harmless
                if (!error.message.includes('pause')) {
                    console.warn("Error cleaning up AR system:", error);
                }
            }

            // Force reload on exit to clear A-Frame contexts if needed
            // window.location.reload(); 
        };
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">

            {/* 3D Scene Layer */}
            <div className="absolute inset-0 z-0">
                <a-scene
                    ref={sceneRef}
                    mindar-image="imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/card.mind; autoStart: true; uiLoading: no; uiError: yes; uiScanning: no;"
                    color-space="sRGB"
                    embedded
                    renderer="colorManagement: true, physicallyCorrectLights"
                    vr-mode-ui="enabled: false"
                    device-orientation-permission-ui="enabled: false"
                >
                    {/* Lights for visibility */}
                    <a-light type="ambient" color="#ffffff" intensity="1"></a-light>
                    <a-light type="directional" position="0 0 1" intensity="1"></a-light>

                    <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

                    <a-entity id="target-jurisics" mindar-image-target="targetIndex: 0">
                        {/* Holographic Base Ring */}
                        <a-ring color="#FCD34D" radius-inner="0.5" radius-outer="0.55" rotation="-90 0 0" position="0 0 0" opacity="0.7" material="shader: flat; transparent: true">
                            <a-animation attribute="opacity" from="0.7" to="0.2" dur="1500" dir="alternate" repeat="indefinite"></a-animation>
                        </a-ring>

                        {/* Spinning 'Scanning' Cubes */}
                        <a-entity position="0 0.5 0" animation="property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true">
                            <a-box position="0.4 0 0" scale="0.1 0.8 0.1" color="#FCD34D" opacity="0.8" material="shader: flat"></a-box>
                            <a-box position="-0.4 0 0" scale="0.1 0.8 0.1" color="#FCD34D" opacity="0.8" material="shader: flat"></a-box>
                            <a-box position="0 0 0.4" scale="0.1 0.8 0.1" color="#FCD34D" opacity="0.8" material="shader: flat"></a-box>
                            <a-box position="0 0 -0.4" scale="0.1 0.8 0.1" color="#FCD34D" opacity="0.8" material="shader: flat"></a-box>
                        </a-entity>

                        {/* Central Hologram Core */}
                        <a-octahedron position="0 0.5 0" radius="0.4" color="cyan" wireframe="true" animation="property: rotation; to: 360 360 0; dur: 5000; easing: linear; loop: true">
                            <a-animation attribute="scale" from="1 1 1" to="1.1 1.1 1.1" dur="1000" dir="alternate" repeat="indefinite"></a-animation>
                        </a-octahedron>

                        {/* Floating Text with Glow */}
                        <a-text value="JURISICS MIKLOS" color="#FCD34D" align="center" position="0 1.3 0" scale="1.2 1.2 1.2" shader="msdf" font="https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/exo2/Exo2-Bold.json"></a-text>
                        <a-text value="HOS / 1532" color="white" align="center" position="0 1.1 0" scale="0.6 0.6 0.6" shader="msdf" font="https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/roboto/Roboto-Regular.json"></a-text>
                    </a-entity>
                </a-scene>
            </div>

            {/* 2D CSS HOLOGRAM SIMULATION LAYER (Guaranteed Visibility) */}
            {isSimulating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none fade-in">
                    {/* Rotating Rings */}
                    <div className="relative w-64 h-64 border-[4px] border-yellow-400/50 rounded-full animate-spin-slow shadow-[0_0_30px_rgba(250,204,21,0.4)]"></div>
                    <div className="absolute w-48 h-48 border-[2px] border-cyan-400/50 rounded-full animate-reverse-spin shadow-[0_0_20px_rgba(34,211,238,0.4)]"></div>

                    {/* Mock 3D Object (Icon) */}
                    <div className="absolute animate-pulse">
                        <div className="text-6xl filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">🛡️</div>
                    </div>

                    {/* HUD Text */}
                    <div className="mt-8 text-center space-y-1">
                        <div className="text-yellow-400 font-bold tracking-[0.2em] text-sm animate-pulse">JURISICS MIKLÓS</div>
                        <div className="text-cyan-400 text-xs font-mono border border-cyan-500/30 px-2 py-1 rounded bg-black/40">SIMULÁLT MÓD</div>
                    </div>
                </div>
            )}

            {/* UI Overlays */}
            <AROverlay
                scanning={scanning}
                targetFound={targetFound}
                onBack={() => navigate('/')}
            />

            {/* DEV: Simulation Button (Hidden in production ideally, but useful for demo) */}
            {!targetFound && (
                <button
                    onClick={handleSimulate}
                    className="absolute top-20 right-4 z-50 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-200 text-xs px-2 py-1 rounded border border-yellow-500/50 backdrop-blur-md pointer-events-auto"
                >
                    🔧 DEV: Szobor Simulálás
                </button>
            )}

            {/* AI Chat Interface (Only shows when target is found/active) */}
            {targetFound && (
                <HeroChat
                    heroName="Jurisics Miklós"
                    messages={heroMessages}
                    onSendMessage={handleUserMessage}
                    isListening={isThinking}
                />
            )}
        </div>
    );
};

export default ARView;
