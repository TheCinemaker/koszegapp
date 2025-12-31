import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// --- SHARED APPLE ANIMATION COMPONENTS ---

/**
 * Slow, cinematic fade up effect for sections/cards
 */
export const FadeUp = ({ children, delay = 0, duration = 1.2, className = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 60, filter: 'blur(10px)' }}
            animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: duration, ease: [0.16, 1, 0.3, 1], delay: delay }}
        >
            {children}
        </motion.div>
    );
};

/**
 * Parallax Image container.
 * Must be placed inside a relative container with overflow-hidden types.
 */
export const ParallaxImage = ({ src, className = "", speed = 1, scale = 1.25 }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // speed defines how much it moves relative to scroll. 
    // Positive values move opposite to scroll (classic parallax).
    const y = useTransform(scrollYProgress, [0, 1], [`-${15 * speed}%`, `${15 * speed}%`]);

    return (
        <div ref={ref} className={`overflow-hidden ${className}`}>
            <motion.img
                style={{ y }}
                src={src}
                alt=""
                className="w-full h-full object-cover"
                initial={{ scale: scale }} // Start slightly zoomed in
            />
        </div>
    );
};

/**
 * Text that reveals opacity based on scroll position (scrubbing).
 * Good for hero headers or emphasis text.
 */
export const GradientRevealText = ({ children, className = "", startOffset = "start 0.95", endOffset = "start 0.4" }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [startOffset, endOffset]
    });

    const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);

    return (
        <motion.p ref={ref} style={{ opacity }} className={className}>
            {children}
        </motion.p>
    );
}
