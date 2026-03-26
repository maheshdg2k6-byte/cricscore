import React, { useState } from 'react';
import { ArrowLeft, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileSidebar from './MobileSidebar';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  showSidebar?: boolean;
  showSearch?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  showSidebar = true,
  showSearch = false,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSearch && (
              <button
                onClick={() => navigate('/search')}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            {rightAction}
            {showSidebar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default PageHeader;
