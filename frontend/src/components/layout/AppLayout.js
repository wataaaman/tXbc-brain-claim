import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Home, FileText, MessageSquare, Settings, LogOut, Menu, X, Sun, Moon,
  Book, Upload, Brain, Vote, Bot, Shield, Scale, HeartPulse, Coins, Crown,
  ChevronDown, Layers
} from 'lucide-react';

const mainNav = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/governance', label: 'DAO', icon: Vote },
  { path: '/agents', label: 'AI Agents', icon: Bot },
];

const portalNav = [
  { path: '/portal/founders', label: "Founders'", icon: Crown },
  { path: '/portal/brain-injury', label: 'Brain Injury', icon: Brain },
  { path: '/portal/insurance', label: 'Insurance', icon: Shield },
  { path: '/portal/legal', label: 'Legal', icon: Scale },
  { path: '/portal/health', label: 'Health', icon: HeartPulse },
  { path: '/portal/finance', label: 'Finance', icon: Coins },
];

const toolNav = [
  { path: '/policies', label: 'Policies', icon: Book },
  { path: '/documents', label: 'Letters', icon: FileText },
  { path: '/evidence', label: 'Evidence', icon: Upload },
  { path: '/assistant', label: 'AI Chat', icon: MessageSquare },
];

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPortals, setShowPortals] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActive = (path) => location.pathname === path;
  const isPortalActive = portalNav.some(p => location.pathname === p.path);

  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link key={item.path} to={item.path} onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}>
        <Icon className="w-4 h-4" />{item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4 md:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-sm shadow-purple-500/20">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:block font-bold text-sm font-[Manrope] text-gradient">Tech X Brain</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {mainNav.map((item) => <NavLink key={item.path} item={item} />)}
            
            {/* Portals Dropdown */}
            <DropdownMenu open={showPortals} onOpenChange={setShowPortals}>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isPortalActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
                  <Layers className="w-4 h-4" />
                  Portals
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Decentralized Portals</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {portalNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="cursor-pointer" onClick={() => setShowPortals(false)}>
                        <Icon className="mr-2 h-4 w-4" />{item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tools separator */}
            <div className="w-px h-5 bg-border/50 mx-1" />
            {toolNav.map((item) => <NavLink key={item.path} item={item} />)}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-8 h-8">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-500 text-white text-xs">{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings" className="cursor-pointer"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="md:hidden rounded-full w-8 h-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl p-4 animate-slide-up max-h-[70vh] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1">Main</p>
              {mainNav.map((item) => <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />)}
              <p className="text-xs font-medium text-muted-foreground px-3 py-1 mt-2">Portals</p>
              {portalNav.map((item) => <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />)}
              <p className="text-xs font-medium text-muted-foreground px-3 py-1 mt-2">Tools</p>
              {toolNav.map((item) => <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />)}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
