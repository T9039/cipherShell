const LOGO_ANIMATIONS = [
    { name: 'fade', out: 'opacity-0', in: 'opacity-100' },
    { name: 'slide-up', out: 'opacity-0 -translate-y-4', in: 'opacity-100 translate-y-0' },
    { name: 'slide-right', out: 'opacity-0 -translate-x-10', in: 'opacity-100 translate-x-0' },
    { name: 'zoom', out: 'opacity-0 scale-90', in: 'opacity-100 scale-100' },
    { name: 'blur', out: 'opacity-0 blur-md', in: 'opacity-100 blur-0' },

// --- COMPLEX ANIMATIONS ---
    { 
        name: 'glitch-swap', 
        out: 'opacity-0 animate-glitch', 
        in: 'opacity-100' 
    },
    { 
        name: 'matrix-reveal', 
        out: 'opacity-0 scale-y-0', 
        in: 'animate-matrix' 
    },
    { 
        name: 'flip-3d', 
        out: 'opacity-0 [transform:rotateX(90deg)]', 
        in: 'opacity-100 [transform:rotateX(0deg)]' 
    },
    { 
        name: 'flicker', 
        out: 'opacity-0', 
        in: 'opacity-100 animate-pulse' // Mimics a failing neon/CRT tube
    },
    { 
        name: 'slide-split', 
        out: 'opacity-0 tracking-[-1em]', 
        in: 'opacity-100 tracking-normal' // Letters "condense" into place
    }
];

function clearAnimations(el) {
    // Remove all possible Tailwind/Custom classes used in the array
    const allPossibleClasses = [
        'opacity-0', 'opacity-100', '-translate-y-4', 'translate-y-0',
        'scale-90', 'scale-100', 'animate-glitch', 'scale-y-0',
        'animate-matrix', '[transform:rotateX(90deg)]', '[transform:rotateX(0deg)]',
        'animate-pulse', 'tracking-[-1em]', 'tracking-normal'
    ];
    el.classList.remove(...allPossibleClasses);
}
