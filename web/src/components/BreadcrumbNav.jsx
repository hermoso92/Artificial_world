
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const BreadcrumbNav = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="w-full border-b border-border bg-background/50 backdrop-blur-sm py-3 px-4 sm:px-6 lg:px-8 flex items-center text-sm text-muted-foreground">
      <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary rounded-sm outline-none">
        <Home className="w-4 h-4" />
        <span className="sr-only">Inicio</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-sm outline-none">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;
