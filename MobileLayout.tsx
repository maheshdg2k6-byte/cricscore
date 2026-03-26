import React from 'react';
import BottomNav from './BottomNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  showNav = true,
  className = '' 
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className={`${showNav ? 'pb-20' : ''} ${className}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
