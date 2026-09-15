import{r as s,j as e,G as o,a as t,D as n}from"./index-49a3991d.js";import{u as c}from"./useGame-7ad5ab32.js";function m(){const[a,r]=s.useState(null);return s.useEffect(()=>{const i=setTimeout(()=>{r("A város jelei nem mindig ott vannak, ahol keresed.")},3e5),l=setTimeout(()=>{r("Ha elindulnál, a Főtér környéke jó kezdet.")},10*60*1e3);return()=>{clearTimeout(i),clearTimeout(l)}},[]),a?e("div",{className:`\r
            fixed bottom-6 left-1/2 -translate-x-1/2 w-full text-center\r
            text-[10px]\r
            uppercase\r
            tracking-[0.3em]\r
            text-white/40\r
            opacity-50\r
            pointer-events-none\r
            transition-opacity duration-1000\r
        `,children:a}):null}function u(){const a=o(),{foundGems:r}=c(),i=r.length>0;return t("div",{className:"min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6",children:[t("div",{className:"absolute top-[30px] left-0 right-0 flex flex-col items-center pointer-events-none z-0",children:[e("div",{className:"font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70 leading-none",children:"1532"}),e("div",{className:"mt-2 text-[10px] md:text-xs uppercase tracking-[0.3em] text-neutral-100/30 font-sans",children:"Van, amit csak a falak tudnak."})]}),t("div",{className:"relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-[32vh] space-y-10 text-center",children:[t(n.div,{initial:{opacity:0,y:40},animate:{opacity:1,y:0},transition:{duration:1.1,ease:"easeOut"},className:"space-y-4",children:[e("p",{className:"text-sm text-white/40 font-mono uppercase tracking-widest",children:"A NEVED MÁR A KRÓNIKÁBAN."}),e("h2",{className:"text-3xl font-serif text-white/90 leading-tight",children:"DE A TÖRTÉNET MÉG NINCS KÉSZ."})]}),t(n.div,{initial:{opacity:0,y:35},animate:{opacity:1,y:0},transition:{duration:1.1,ease:"easeOut",delay:.2},className:"mt-4 text-white/60 leading-relaxed font-light max-w-xs uppercase tracking-wider text-xs space-y-4",children:[t("p",{children:["A VÁROS EGY TÉRKÉP,",e("br",{}),"DE NEM TÁVOLSÁGOKAT MÉR,",e("br",{}),"HANEM IDŐT."]}),e("p",{className:"items-center text-amber-500/80 font-bold",children:"INDULJ EL ÉS A FALAK SEGÍTENEK FELFEDNI AZ IGAZSÁGOT!"}),e("p",{className:"font-serif italic text-white/40 lowercase tracking-normal",children:"A kövek mutatják majd az utat."})]}),t("div",{className:"mt-16 space-y-6 flex flex-col items-center w-full max-w-xs mx-auto",children:[e(n.button,{initial:{opacity:0,y:40},animate:{opacity:1,y:0},transition:{duration:1,delay:.4},onClick:()=>a("/game/scan"),className:`\r
                            w-full\r
                            text-xs\r
                            uppercase\r
                            tracking-[0.4em]\r
                            text-blue-300\r
                            opacity-80\r
                            hover:opacity-100\r
                            transition-opacity\r
                            border-b border-blue-300/20\r
                            hover:border-blue-300/40\r
                            pb-3\r
                        `,children:"Jel beolvasása →"}),e(n.button,{initial:{opacity:0,y:40},animate:{opacity:1,y:0},transition:{duration:1,delay:.6},onClick:()=>a("/game/treasure-chest"),className:`\r
                            w-full\r
                            text-xs\r
                            uppercase\r
                            tracking-[0.4em]\r
                            text-white/40\r
                            hover:text-blue-300/80\r
                            transition-colors\r
                            border-b border-transparent\r
                            hover:border-blue-300/10\r
                            pb-3\r
                        `,children:"Megnézem, mit őriz →"})]}),i?e(n.button,{initial:{opacity:0,y:30},animate:{opacity:1,y:0},transition:{duration:.9,delay:.6},onClick:()=>a("/game/scan"),className:`\r
                            mt-6\r
                            text-xs\r
                            uppercase\r
                            tracking-[0.4em]\r
                            text-white/70\r
                            hover:text-white\r
                            transition-colors\r
                        `,children:"Új időkapu keresése →"}):e(n.div,{initial:{opacity:0,y:30},animate:{opacity:1,y:0},transition:{duration:.9,delay:.6},className:"mt-8 text-sm text-neutral-100/30 leading-relaxed max-w-xs",children:e("p",{className:"font-serif italic text-white/40",children:"A falakon keresd a jelet. (QR kódok)"})})]}),e(m,{})]})}export{u as default};
