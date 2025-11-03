import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            src="/logo-kfa.png" 
            alt="Kimia Farma Logo" 
            {...props}
            className={`${props.className || ''}`}
        />
    );
}
