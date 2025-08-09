import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const Logo = ({ 
  size = 'medium', 
  showText = true, 
  variant = 'default', // 'default', 'white', 'dark'
  sx = {},
  textSx = {}
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80
  };

  const textSizeMap = {
    small: 'h6',
    medium: 'h5',
    large: 'h4',
    xlarge: 'h3'
  };

  const logoSize = sizeMap[size];

  // Use PNG image with fallback
  const LogoImage = () => {
    const borderStyle = variant === 'white' || variant === 'light' ? {
      border: '2px solid #000000',
      borderRadius: '50%'
    } : {};

    return (
      <Box
        component="img"
        src="/logo.png"
        alt="GameOn Logo"
        sx={{
          width: logoSize,
          height: logoSize,
          objectFit: 'contain',
          display: 'block',
          ...borderStyle
        }}
        onError={(e) => {
          // Fallback to Avatar with 'G' if image fails to load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  };

  // Fallback placeholder when image is not available
  const LogoPlaceholder = () => (
    <Avatar
      sx={{
        width: logoSize,
        height: logoSize,
        bgcolor: 'primary.main',
        fontSize: logoSize * 0.4,
        fontWeight: 'bold',
        display: 'none'
      }}
    >
      G
    </Avatar>
  );

  const textColor = variant === 'white' ? '#ffffff' : variant === 'dark' ? '#1a1a1a' : 'inherit';

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: showText ? 2 : 0,
        ...sx 
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <LogoImage />
        <LogoPlaceholder />
      </Box>
      {showText && (
        <Typography 
          variant={textSizeMap[size]} 
          component="span" 
          fontWeight="bold"
          sx={{ 
            color: textColor,
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            ...textSx 
          }}
        >
          GameOn
        </Typography>
      )}
    </Box>
  );
};

export default Logo;