import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg 
      viewBox="250 250 520 300" 
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 0.75} // Maintain aspect ratio
      className={className}
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
          <feOffset dx="0" dy="6" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
            
      <g filter="url(#shadow)">
        {/* Pink/Magenta triangle (left) - rounded corners */}
        <path d="M 260 540 
                 Q 270 540 280 525 
                 L 345 400 
                 Q 355 385 365 400 
                 L 430 525 
                 Q 440 540 450 540 
                 Z" 
              fill="#E84393" 
              opacity="0.7"/>
        
        {/* Blue triangle (center, tallest) - rounded corners, centered */}
        <path d="M 370 540 
                 Q 380 540 390 525 
                 L 495 270 
                 Q 505 255 515 270 
                 L 620 525 
                 Q 630 540 640 540 
                 Z" 
              fill="#5B9BD5" 
              opacity="0.7"/>
        
        {/* Green triangle (right) - rounded corners, same size as pink */}
        <path d="M 560 540 
                 Q 570 540 580 525 
                 L 645 400 
                 Q 655 385 665 400 
                 L 730 525 
                 Q 740 540 750 540 
                 Z" 
              fill="#81C784" 
              opacity="0.7"/>
      </g>
    </svg>
  );
};
