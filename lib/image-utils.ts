import React from 'react';
import Image from 'next/image';

interface ImageProps {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const generateAltText = (imageName: string): string => {
  // Remove file extension and special characters
  const cleanName = imageName
    .split('.')
    .slice(0, -1)
    .join('.')
    .replace(/[_-]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  // Capitalize first letter of each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const ImageWithFallback: React.FC<ImageProps> = ({
  src,
  alt,
  title,
  className,
  width = 100,
  height = 100
}) => {
  const fileName = src.split('/').pop() || '';
  const generatedAlt = generateAltText(fileName);
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div className={className}>
        <span>Image failed to load</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || generatedAlt}
      title={title || generatedAlt}
      className={className}
      width={width}
      height={height}
      onError={() => setError(true)}
    />
  );
}; 